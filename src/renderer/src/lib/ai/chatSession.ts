import { Chat, Content, CreateChatParameters, FunctionDeclaration, GenerateContentConfig, GoogleGenAI, HarmBlockThreshold, HarmCategory, Modality, Part, ThinkingConfig } from "@google/genai";
import { Config, historySessionModel, safetyLevel } from "@renderer/lib/data/config";
import { GeminiToolType, session } from "@shared/types/session";
import { getRawMessageBySessionID } from "@renderer/lib/data/db";


const safetyLevelToThreshold = (level: safetyLevel) => {
    switch (level) {
        case safetyLevel.NA:
            return HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED;
        case safetyLevel.BLOCK_FEW:
            return HarmBlockThreshold.BLOCK_LOW_AND_ABOVE;
        case safetyLevel.BLOCK_SOME:
            return HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
        case safetyLevel.BLOCK_MOST:
            return HarmBlockThreshold.BLOCK_ONLY_HIGH;
        case safetyLevel.BLOCK_NONE:
            return HarmBlockThreshold.BLOCK_NONE;
        case safetyLevel.BLOCK_OFF:
            return HarmBlockThreshold.OFF;
    }
}

export class ChatSession {
    private conf: Config;
    private systemInstruction: string;
    private static defaultSystemInstructions = "You are a helpful assistant. Please answer the user's questions to the best of your ability.";
    private chatConfig: GenerateContentConfig | undefined;
    private chatSession?: Chat;
    private chatParameters: CreateChatParameters;
    private model: string;
    private client: GoogleGenAI;
    private sessionUUID: string;
    public static async createSession(client: GoogleGenAI, config: Config, session: session, currentModel?: string);
    public static async createSession(client: GoogleGenAI, config: Config, session: string, currentModel?: string);
    public static async createSession(client: GoogleGenAI, config: Config, session: string | session, model?: string) {
        let sessionInfo: string | { session: session, messages: Content[] } = typeof (session) === "string" ? session : { session: session, messages: [] };
        const historySession = typeof (session) === "string" ? undefined : session;
        let sessionModel = model || config.defaultModel;
        if (typeof (session) !== "string") {
            const historyMessage = await ChatSession.getRecordedMessages(typeof (session) === "string" ? session : session.uuid);
            if (historySession) {
                sessionInfo = { session: historySession, messages: historyMessage };
            }
            switch (config.sessionLoadModel) {
                case historySessionModel.defaultModel:
                    sessionModel = config.defaultModel;
                    break;
                case historySessionModel.currentModel:
                    sessionModel = model || config.defaultModel;
                    break;
                case historySessionModel.recordedModel:
                    sessionModel = session.model;
                    break;
            }
        }
        return new ChatSession(client, config, sessionInfo, sessionModel);
    }

    private constructor(client: GoogleGenAI, config: Config, sessionInfo: string | { session: session, messages: Content[] }, model?: string) {
        this.sessionUUID = typeof (sessionInfo) === "string" ? sessionInfo : sessionInfo.session.uuid;
        this.conf = config;
        this.systemInstruction = config.systemInstruction || ChatSession.defaultSystemInstructions;
        this.client = client;
        let history: Content[] | undefined = undefined;
        if (typeof (sessionInfo) !== "string") {
            history = sessionInfo.messages;
        }
        if (model) {
            this.model = model;
        } else {
            this.model = this.conf.defaultModel;
        }
        this.createGenerateContentConfig();
        this.chatParameters = {
            model: this.model,
            config: this.chatConfig,
            history: history,
        }
        this.chatSession = client.chats.create(this.chatParameters);
    }

    private static async getRecordedMessages(uuid: string) {
        const rawMessages = await getRawMessageBySessionID(uuid);
        let contents: Content[] = [];
        rawMessages.map((r) => {
            if (r.content && !(r.hasError === true)) {
                if (!r.content.role) {
                    console.log(r);
                }
                contents = [...contents, r.content]
            }
        });
        return contents;
    }

    public getModel() {
        return this.model;
    }

    public getSessionUUID() {
        return this.sessionUUID;
    }

    private isImageGeneration() {
        return this.model!.indexOf("image-generation") > 0;
    }

    public changeModel(model: string) {
        if (this.model !== model) {
            if (this.chatSession) {
                this.chatParameters.model = model;
                const history = this.chatSession.getHistory();
                if (!this.systemInstruction) {
                    this.systemInstruction = this.systemInstruction;
                }
                if (this.isImageGeneration()) {
                    this.chatConfig!.responseModalities = [Modality.TEXT, Modality.IMAGE];
                    this.chatConfig!.systemInstruction = undefined;
                }

                this.chatConfig!.thinkingConfig = this.genThoughtConfig();

                this.chatSession = this.client.chats.create({
                    ...this.chatParameters,
                    history: history,
                });
            }
        }
    }

    public async sendMessageStream(message: string | Part[], abortSignal?: AbortController) {
        if (this.chatSession) {
            return this.chatSession.sendMessageStream({
                message: message,
                config: { ...this.chatConfig, abortSignal: abortSignal ? abortSignal.signal : undefined },
            });
        }
        return undefined;
    }

    public updateConfig(config: Config) {
        this.conf = config;
        this.systemInstruction = config.systemInstruction || ChatSession.defaultSystemInstructions;
        this.createGenerateContentConfig();
        this.chatParameters.config = this.chatConfig;
        if (this.chatSession) {
            const history = this.chatSession.getHistory();
            this.chatSession = this.client.chats.create({
                ...this.chatParameters,
                history: history,
            });
        }
    }

    private genThoughtConfig() {
        if (!this.model) {
            return undefined;
        }
        let thoughtConfig: ThinkingConfig | undefined = undefined;
        if (this.model!.indexOf("gemini-2.5") > -1) {
            thoughtConfig = {}
            if (this.model!.indexOf("gemini-2.5-pro") > 0) {
                if (this.conf!.disableThought) {
                    thoughtConfig.thinkingBudget = 128;
                    thoughtConfig.includeThoughts = this.conf!.showThought || false;
                } else {
                    if (this.conf!.dynThought) {
                        thoughtConfig.thinkingBudget = -1;
                    } else {
                        thoughtConfig.thinkingBudget = this.conf!.thoughtCoast === undefined ? 128 : this.conf!.thoughtCoast >= 128 ? this.conf!.thoughtCoast : 128;
                    }
                    thoughtConfig.includeThoughts = this.conf!.showThought || false;
                }
            } else if (this.model!.indexOf("gemini-2.5-flash") > 0) {
                if (this.conf!.disableThought) {
                    thoughtConfig.thinkingBudget = 0;
                    thoughtConfig.includeThoughts = this.conf!.showThought || false;
                } else {
                    if (this.conf!.dynThought) {
                        thoughtConfig.thinkingBudget = -1;
                    } else {
                        thoughtConfig.thinkingBudget = this.conf!.thoughtCoast === undefined ? 0 : this.conf!.thoughtCoast;
                    }
                    thoughtConfig.includeThoughts = this.conf!.showThought || false;
                }
            }
        }
        return thoughtConfig;
    }

    private createGenerateContentConfig() {
        this.chatConfig = {
            systemInstruction: this.systemInstruction,
            topP: this.conf!.topP,
            temperature: this.conf!.temprature,
            maxOutputTokens: this.conf!.maxOutputToken,
            thinkingConfig: this.genThoughtConfig(),
            safetySettings: [{
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: safetyLevelToThreshold(this.conf!.HateSpeech),
            },
            {
                category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold: safetyLevelToThreshold(this.conf!.CivicIntegrity),
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: safetyLevelToThreshold(this.conf!.Dangerous),
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: safetyLevelToThreshold(this.conf!.Harassment),
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: safetyLevelToThreshold(this.conf!.SexuallyExplicit),

            }],
        };
        if (this.conf.endPoint && this.conf.endPoint.length > 0) {
            this.chatConfig.httpOptions = {
                baseUrl: this.conf.endPoint,
            }
        }
    }

    public setTools(tools: GeminiToolType[], functions?: FunctionDeclaration[]) {
        this.chatConfig!.tools = [];
        if (tools.length > 0) {
            for (const tool of tools) {
                switch (tool) {
                    case "codeExec":
                        this.chatConfig!.tools = [...this.chatConfig!.tools!, { codeExecution: {} }]
                        break;
                    case "function":
                        if (functions) {
                            this.chatConfig!.tools = [{ functionDeclarations: functions }];
                        }
                        break;
                    case "search":
                        this.chatConfig!.tools = [...this.chatConfig!.tools!, { googleSearch: {} }];
                        break;
                    case "urlContext":
                        this.chatConfig!.tools = [...this.chatConfig!.tools!, { urlContext: {} }]
                        break;
                    default:
                        throw new Error("unknow tool");
                }
            }
        }
    }

    public updateSystemInstruction(instruction: string) {
        this.systemInstruction = instruction;
        this.chatConfig!.systemInstruction = instruction;
    }

    public getHistory() {
        return this.chatSession ? this.chatSession.getHistory() : undefined;
    }

    public getSystemInstruction() {
        return this.systemInstruction;
    }
}