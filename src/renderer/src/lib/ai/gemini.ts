import { Chat, Content, CreateChatParameters, FinishReason, FunctionCall, FunctionDeclaration, GenerateContentConfig, GenerateContentResponse, GoogleGenAI, GroundingMetadata, HarmBlockThreshold, HarmCategory, Modality, Part, ThinkingConfig } from "@google/genai";
import { FileInfo, Message, MessageCancelFn } from "@shared/types/message";
import { addNewSessions, addRawMessage, getRawMessageBySessionID, getSession, setSessionTitle, updateSessionInstruction, rawMessage, updateSessionLastUpdate } from "@renderer/lib/data/db";
import { GeminiToolType, session } from "@shared/types/session";
import { Config, historySessionModel, safetyLevel } from "../data/config";
import { getMimeType, readFile } from "../util/files";
import { isYoutubeURI } from "../util/misc";
import { runMcpTool } from "../util/mcpIpc";
import { getModelVersionNumber } from "../util/model";
interface callbackRegister {
    addMsg?: messageAdder,
    refleshSessions?: () => void,
    setCurrentSessionID?: (id: string) => void,
    setCurrentSssion?: (s: session | null) => void,
    cleanMsg?: () => void,
    setCurrentModel?: (m: string) => void,
    abortMessage?: (key: string, cancel: MessageCancelFn) => void,
    deleteAbortMessage?: (key: string) => void,
    finsedLoadSession?: () => void,
}

let callbacks: callbackRegister = {};

type messageAdder = (msg: Message, flag: boolean) => void;

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
class Chatter {
    private client: GoogleGenAI;
    private session?: Chat;
    private sessionUUID?: string;
    private model?: string;
    private msgCtrl?: messageAdder;
    private fleshSession?: () => void;
    private setCurrentSessionID?: (id: string) => void;
    private setCurrentSession?: (s: session | null) => void;
    private setCurrentModel?: (m: string) => void;
    private saved: boolean;
    private apiKey?: string;
    private clearMessags?: () => void;
    private conf?: Config;
    private rounded?: number;
    private userSession?: session;
    private systemInstruction: string;
    private config?: GenerateContentConfig;
    private cancelMessage?: (key: string, cancel: MessageCancelFn) => void;
    private deleteCancelMessage?: (key: string) => void;
    private finshedLoadSession?: () => void;
    private tmpSession: boolean;

    private prepare() {
        this.saved = false;
        this.session = undefined;
        this.sessionUUID = undefined;
        this.rounded = undefined;
        this.userSession = undefined;
        this.systemInstruction = this.conf!.systemInstruction || "你是有用的助手";
        this.config = {
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
        if (this.conf!.endPoint && this.conf!.endPoint.length > 0) {
            this.config.httpOptions = {
                baseUrl: this.conf!.endPoint,
            }
        }

    }
    constructor(conf: Config, tmp: boolean) {
        this.conf = conf;
        this.client = new GoogleGenAI({
            apiKey: conf.apikey
        });
        this.saved = false;
        this.apiKey = conf.apikey;
        this.systemInstruction = this.conf!.systemInstruction || "你是有用的助手";
        this.prepare();
        this.SelectModel(conf.defaultModel);
        this.tmpSession = tmp;

    }
    public SelectModel(model: string) {
        if (this.model && this.model === model && this.session) {
            return;
        }
        this.model = model;
        this.prepare();
        this.session = this.client.chats.create({
            model: model,
            config: this.config,
        });
    }

    public createMessageText(content?: Content, groundData?: GroundingMetadata) {
        let text = "";
        let thinking = false;
        let fc: undefined | FunctionCall[] = undefined;
        if (content && content.parts) {
            const p = content.parts[0];
            if (p.thought) {
                thinking = true;
            }
            if (p.text) {
                text += p.text;
            }
            if (p.executableCode) {
                text += "\ncode exec:\n```" + p.executableCode.language + "\n" + p.executableCode.code + "\n```";
            }
            if (p.codeExecutionResult) {
                text += "\n code run result:\n" + p.codeExecutionResult.output || "" + "\n"
            }
            if (p.inlineData) {
                const dataURL = "data:" + p.inlineData.mimeType + ";base64," + p.inlineData.data;
                text += `\n<img src="http://dev.xwrt.aichatter/${dataURL}" alt="gen image">\n`;
                // text += `\n![gen image](http://localhost/${dataURL})\n`;
            }
            for (const fp of content.parts) {
                if (fp.functionCall) {
                    if (!fc) {
                        fc = [];
                    }
                    fc = [...fc, fp.functionCall];
                }
            }
        }
        if (groundData) {
            if (groundData.searchEntryPoint?.renderedContent) {
                text += "\n" + groundData.searchEntryPoint.renderedContent + "\n";
            }
        }
        return thinking ? { thinking: text.length > 0 ? text : undefined, msgText: undefined, fcall: fc } : {
            thinking: undefined,
            msgText: text.length > 0 ? text : undefined,
            fcall: fc,
        };
    }

    private async genFileContent(msg: string, files?: FileInfo[]) {
        let fileInfos: undefined | FileInfo[] = undefined;
        let contents: undefined | Part[] = undefined;
        if (files) {
            for (const f of files) {
                if (!fileInfos) {
                    fileInfos = [];
                }
                if (!contents) {
                    contents = [];
                }
                if (isYoutubeURI(f.path)) {
                    fileInfos = [...fileInfos, {
                        fileType: "",
                        path: f.path,
                        youtube: f.youtube,
                        ytFps: f.ytFps,
                        ytStart: f.ytStart,
                        ytStop: f.ytStop,
                    }];
                    const p: Part = {
                        fileData: {
                            fileUri: f.path,
                        },
                        videoMetadata: {
                            startOffset: f.ytStart ? `${f.ytStart}s` : undefined,
                            endOffset: f.ytStop ? `${f.ytStop}s` : undefined,
                            fps: f.ytFps,
                        }
                    }
                    contents = [...contents, p];
                    continue;
                }
                fileInfos = [...fileInfos, {
                    fileType: getMimeType(f.path),
                    path: f.path
                }];
                const data = await readFile(f.path);


                contents = [...contents, {
                    inlineData: {
                        mimeType: getMimeType(f.path),
                        data: data
                    }
                }]
            }
            // const size = await getAllFilesSize(files);
        }
        if (contents) {
            contents = [{ text: msg }, ...contents]
        }
        return { fileInfos, contents }
    }

    private addUserMsg(msg: string, fileInfos?: FileInfo[], sessionID?: string) {
        if (this.msgCtrl) {
            this.msgCtrl({
                role: "user",
                id: "",
                message: msg,
                isError: false,
                errInfo: "",
                files: fileInfos ? fileInfos : [],
                hasFuncCall: false,
                funcCalls: [],
                finished: true,
                sessionID: sessionID,
            }, true)
        }
    }

    private async processResponse(firstResponse: boolean, response: Promise<AsyncGenerator<GenerateContentResponse, any, any>>, sessionID: string) {
        // let rawModelMessages: rawMessage[] = [];
        let hasError = false;
        let funcs: FunctionCall[] = [];
        let errInfo: string | undefined = undefined;
        try {
            let hasContent = false;
            for await (const chunk of await response) {
                if (!chunk.candidates) {
                    continue;
                }
                for (const v of chunk.candidates) {
                    hasContent = true;
                    const modelMessage: rawMessage = {
                        content: v.content,
                        groundMetadata: v.groundingMetadata,
                        sessionID: this.sessionUUID!,
                        role: "model"
                    }
                    // rawModelMessages = [...rawModelMessages, modelMessage];

                    const { thinking, msgText, fcall } = this.createMessageText(v.content, v.groundingMetadata);
                    if (msgText || thinking || fcall) {
                        let msg: Message = {
                            role: "assistant",
                            id: "",
                            message: msgText || "",
                            thinking: thinking,
                            isError: false,
                            errInfo: "",
                            files: [],
                            hasFuncCall: fcall ? fcall.length > 0 : false,
                            funcCalls: fcall ? [...fcall] : [],
                            finished: false,
                            sessionID: sessionID
                        };
                        if (this.msgCtrl) {
                            this.msgCtrl(msg, firstResponse);
                        }
                        if (firstResponse) {
                            firstResponse = !firstResponse;
                        }
                    }
                    if (fcall) {
                        funcs = [...funcs, ...fcall]
                    }
                    if (!this.tmpSession) {
                        await addRawMessage(modelMessage);
                    }
                    if (v.finishReason && v.finishReason !== FinishReason.STOP) {
                        console.log("finished reason:", v.finishReason);
                        throw new Error("unnormal finished reason: " + v.finishReason);
                    }
                }
            }
            if (!hasContent) {
                console.log("get empty response");
            }
        } catch (e) {
            hasError = true;
            console.error(e);
            if (!this.tmpSession) {
                await addRawMessage({
                    role: "model",
                    sessionID: sessionID!,
                    errInfo: (e as Error).message,
                    hasError: true,
                });
            }
            this.setErrMsg(firstResponse, e as Error, sessionID!);
            errInfo = (e as Error).toString();
            if (firstResponse) {
                firstResponse = !firstResponse;
            }
        }
        return { error: hasError, functions: funcs, first: firstResponse, errInfo: errInfo }
    }

    private async getOrCreateSession(abort?: AbortController) {
        let sessionID: string = crypto.randomUUID();
        let userSession: session | null = null;
        if (this.saved) {
            sessionID = this.sessionUUID!;
            userSession = this.userSession!;
        } else {
            userSession = {
                model: this.model!,
                apikey: this.apiKey!,
                createTime: Math.floor(Date.now() / 1000),
                updateTime: Math.floor(Date.now() / 1000),
                sessionName: "unname",
                named: false,
                uuid: sessionID,
                instruction: this.systemInstruction
            };
            this.userSession = userSession;


            if (this.setCurrentSessionID) {
                console.log("set current sessionID:", sessionID)
                this.setCurrentSessionID(sessionID);
            }
            if (this.setCurrentSession) {
                this.setCurrentSession(userSession);
            }

            this.saved = true;
            this.sessionUUID = sessionID;
            if (!this.tmpSession) {
                await addNewSessions(userSession!);
                if (this.fleshSession) {
                    this.fleshSession();
                }
            }
        }
        if (abort && this.cancelMessage) {
            await (async () => {
                this.cancelMessage!(sessionID, () => {
                    abort?.abort();
                });
            })();
        }
        await (async () => {
            if (!this.saved && this.setCurrentSessionID) {
                this.setCurrentSessionID(sessionID);
            }
        })();
        return { sessionID, userSession };
    }

    public async sendMessageStream(msg: string, files?: FileInfo[]) {
        const conf = this.conf!;
        if (!this.session) {
            throw new Error("create session first");
        }
        const chatSession = this.session;
        let abort: AbortController | undefined = undefined;
        if (this.cancelMessage) {
            abort = new AbortController();
        }
        const { sessionID, userSession } = await this.getOrCreateSession(abort);

        const { fileInfos, contents } = await this.genFileContent(msg, files);
        const response = chatSession.sendMessageStream({
            message: contents ? contents : msg,
            config: { ...this.config!, abortSignal: abort?.signal }
        });
        let rounded = !this.rounded ? 0 : this.rounded;
        // if (!this.rounded) {
        //     this.rounded = 0
        // }
        rounded += 1;

        this.addUserMsg(msg, fileInfos, sessionID);
        let firstResponse = true;
        // if (!this.saved) {
        //     this.sessionUUID = crypto.randomUUID();
        // }
        // this.addUserMsg(msg, fileInfos, sessionID);
        // let firstResponse = true;

        const userRawMsg: rawMessage = {
            content: contents ? { role: "user", parts: contents } : { role: "user", parts: [{ text: msg }] },
            sessionID: sessionID,
            files: fileInfos ? fileInfos : undefined,
            role: "user",
        }
        // await addRawMessage(userRawMsg);
        // let rawModelMessages: rawMessage[] = [userRawMsg];
        if (!this.tmpSession) {
            await addRawMessage(userRawMsg);
        }
        let hasError = false;
        let funcs: FunctionCall[] = [];

        let eInfo: undefined | string = undefined;
        const { error, functions, first, errInfo } = await this.processResponse(firstResponse, response, sessionID);
        eInfo = errInfo;
        firstResponse = first;
        hasError = error;
        this.setLastMsg(firstResponse, hasError, eInfo, sessionID);
        funcs = [...functions];
        if (!hasError && funcs.length > 0) {
            const res: any[] = [];
            let parts: Part[] = [];
            for (const fun of funcs) {
                const r = await runMcpTool(fun);
                res.push(r);
                parts.push({
                    functionResponse: {
                        id: fun.id,
                        name: fun.name,
                        response: r,
                    }
                });
                console.log("run mcp tool:", fun.name, "response:", r, "parts:", parts);
            }
            const funcMsg: rawMessage = {
                content: { parts: parts, role: "user" },
                sessionID: sessionID,
                files: undefined,
                role: "user",
            }
            // rawModelMessages = [...rawModelMessages, funcMsg];
            if (!this.tmpSession) {
                await addRawMessage(funcMsg);
            }
            const { error, errInfo } = await this.processFuncsUserMsg(chatSession, parts, sessionID, conf, abort);
            eInfo = errInfo;
            if (error) {
                funcMsg.hasError = error;
            }
        }

        if (this.deleteCancelMessage) {
            this.deleteCancelMessage(sessionID);
        }

        if (this.sessionUUID === sessionID) {
            this.rounded = rounded;
        }
        if (!this.tmpSession) {
            await this.updateSessionAfterMessage(sessionID, conf, rounded, userSession, hasError, userSession.named ? undefined : chatSession.getHistory());
        }
    }

    private async processFuncsUserMsg(chat: Chat, parts: Part[], sessionID: string, conf: Config, abort?: AbortController) {
        const response = chat.sendMessageStream({
            message: parts,
            config: {
                ...conf,
                abortSignal: abort?.signal,
            }
        });
        let firstResponse = true;
        let hasError = false;
        let funcs: FunctionCall[] = [];
        let eInfo: undefined | string = undefined;
        const { error, functions, first, errInfo } = await this.processResponse(firstResponse, response, sessionID);
        eInfo = errInfo;
        hasError = error;
        firstResponse = first;
        funcs = [...funcs, ...functions];
        this.setLastMsg(firstResponse, hasError, eInfo, sessionID);
        if (funcs.length > 0 && !hasError) {
            const res: any[] = [];
            let fparts: Part[] = [];
            for (const fun of funcs) {
                const r = await runMcpTool(fun);
                res.push(r);
                fparts.push({
                    functionResponse: {
                        id: fun.id,
                        name: fun.name,
                        response: r,
                    }
                });
            }
            const funcMsg: rawMessage = {
                content: { parts: fparts, role: "user" },
                sessionID: sessionID,
                files: undefined,
                role: "user",
            }
            if (!this.tmpSession) {
                await addRawMessage(funcMsg);
            }
            const { error, errInfo } = await this.processFuncsUserMsg(chat, fparts, sessionID, conf, abort);
            eInfo = errInfo;
            hasError = error;
        }

        return { error: hasError, eInfo }

    }

    private setErrMsg(firstResponse, e: Error, sessionID?: string) {
        const msg: Message = {
            role: "assistant",
            id: "",
            message: "",
            isError: true,
            errInfo: "" + e,
            files: [],
            hasFuncCall: false,
            funcCalls: [],
            finished: false,
            sessionID: sessionID,
        };
        if (this.msgCtrl) {
            this.msgCtrl(msg, firstResponse);
        }
    }
    private setLastMsg(firstResponse: boolean, hasError: boolean, errInfo?: string, sessionID?: string) {
        if (!firstResponse && this.msgCtrl) {
            let msg: Message = {
                role: "assistant",
                id: "",
                message: "",
                isError: hasError,
                errInfo: errInfo || "",
                files: [],
                hasFuncCall: false,
                funcCalls: [],
                finished: true,
                sessionID: sessionID,
            }
            this.msgCtrl(msg, firstResponse);
        }
    }

    private async updateSessionAfterMessage(sessionID: string, conf: Config, rounded: number, userSession: session, hasError: boolean, history?: Content[]) {
        await this.updateSession(sessionID);

        if (!hasError && !this.tmpSession && history && conf.autoGenSessionName && rounded >= conf.genSessionNameAfter && userSession && !userSession.named) {
            this.createSessionTitle(history, conf, userSession)
        }
    }

    private async updateSession(sessionID: string) {

        await updateSessionLastUpdate(sessionID);
        if (this.fleshSession) {
            this.fleshSession();
        }

    }

    private async createSessionTitle(history: Content[], conf: Config, userSession: session) {
        if (this.userSession?.uuid === userSession.uuid) {
            this.userSession.named = true;
        }
        let config: GenerateContentConfig = {
            thinkingConfig: {
                includeThoughts: false,
            }
        }
        if (getModelVersionNumber(conf.namedSessionModel) < 2.5) {
            config.thinkingConfig = undefined;
        }
        if (conf.endPoint) {
            config.httpOptions = {
                baseUrl: this.conf!.endPoint,
            }
        }
        // Remove inlineData from history content
        const tmpHistory = history.map(content => {
            if (content.parts) {
                content.parts = content.parts.filter(part => !part.inlineData);
            }
            return content;
        });
        const cleanedHistory = tmpHistory.filter(c => c.parts && c.parts.length > 0);
        if (cleanedHistory.length < 2) {
            return;
        }
        let c = new GoogleGenAI({
            apiKey: this.conf!.apikey,

        });
        // if (this.model!.indexOf("image-generation") > 0) {
        //     config.responseModalities = [Modality.IMAGE, Modality.TEXT];
        // }

        let s = c.chats.create({
            history: cleanedHistory,
            model: this.conf!.namedSessionModel,
            config: config,
        });
        const msgs = await s.sendMessage({
            message: "用对话使用的主要语言为上述对话取一个简短的标题,只需要输出标题，不需要其他附带的信息和格式"
        });
        if (msgs.text) {
            this.updateSessionTitle(userSession.uuid, msgs.text);
        }
    }

    public async updateSessionTitle(id: string, title: string) {
        await setSessionTitle(id, title);
        if (this.userSession) {
            this.userSession.sessionName = title;
        }
        if (this.fleshSession) {
            this.fleshSession();
        }
    }

    private isImageGeneration() {
        return this.model!.indexOf("image-generation") > 0;
    }
    public changeModel(model: string) {
        this.model = model;
        if (this.session) {
            const history = this.session.getHistory();
            if (this.isImageGeneration()) {
                this.config!.responseModalities = [Modality.TEXT, Modality.IMAGE]
                this.config!.systemInstruction = undefined;
            } else {
                this.config!.responseModalities = undefined;
                this.config!.systemInstruction = this.conf!.systemInstruction;
            }
            this.config!.thinkingConfig = this.genThoughtConfig();
            this.session = this.client!.chats.create({
                history: history,
                model: model,
                config: this.config,
            });

        } else {

            if (this.isImageGeneration()) {
                this.config!.responseModalities = [Modality.TEXT, Modality.IMAGE]
            } else {
                this.config!.responseModalities = undefined;
            }
        }
    }

    public toolSet(tools: GeminiToolType[], functions?: FunctionDeclaration[]) {
        let config: CreateChatParameters = {
            model: this.model!,
            history: this.session!.getHistory(),
        }
        this.config!.tools = [];
        if (tools.length > 0) {
            for (const tool of tools) {
                switch (tool) {
                    case "codeExec":
                        this.config!.tools = [...this.config!.tools!, { codeExecution: {} }]
                        break;
                    case "function":
                        if (functions) {
                            this.config!.tools = [{ functionDeclarations: functions }];
                        }
                        break;
                    case "search":
                        this.config!.tools = [...this.config!.tools!, { googleSearch: {} }];
                        break;
                    case "urlContext":
                        this.config!.tools = [...this.config!.tools!, { urlContext: {} }]
                        break;
                    default:
                        throw new Error("unknow tool");
                }
            }
        }
        config.config = this.config;
        this.session = this.client!.chats.create(config);
    }

    public newSession() {
        if (this.conf!.newSessionModelUseDefault) {
            if (this.model !== this.conf!.defaultModel) {
                this.changeModel(this.conf!.defaultModel);
                if (this.setCurrentModel) {
                    this.setCurrentModel(this.model!);
                }
            }
        }
        if (this.conf!.newSessionModelUseDefault) {
            this.model = this.conf!.defaultModel;
        }
        this.prepare();
        if (this.setCurrentSessionID) {
            this.setCurrentSessionID("");
        }
        if (this.setCurrentSession) {
            this.setCurrentSession(null);
        }
        if (this.isImageGeneration()) {
            this.config!.responseModalities = [Modality.IMAGE, Modality.TEXT]
            this.config!.systemInstruction = undefined;
        } else {
            this.config!.responseModalities = undefined;
            this.config!.systemInstruction = this.systemInstruction;
        }
        this.session = this.client!.chats.create({
            model: this.model!,
            config: this.config,
        });
        if (this.clearMessags) {
            this.clearMessags();
        }
    }

    public updateConf(conf: Config) {
        this.conf = conf;
        const tools = this.config!.tools;
        const ins = this.userSession ? this.userSession.instruction : conf.systemInstruction;
        const history = this.session?.getHistory();

        this.config = {
            systemInstruction: ins,
            topP: this.conf!.topP,
            temperature: this.conf!.temprature,
            maxOutputTokens: this.conf!.maxOutputToken,
            thinkingConfig: this.genThoughtConfig(),
            tools: tools,
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

        }
        if (this.conf!.endPoint && this.conf!.endPoint.length > 0) {
            this.config.httpOptions = {
                baseUrl: this.conf!.endPoint,
            }
        }
        this.session = this.client.chats.create({
            history: history,
            model: this.model!,
            config: this.config!,
        });

    }

    public async loadSession(id: string) {
        const session = await getSession(id);
        if (session) {
            if (this.clearMessags) {
                await (async () => {
                    this.clearMessags!();
                })();
            }

            const rawMessages = await getRawMessageBySessionID(session.uuid);
            if (rawMessages.length < 1) {
                return;
            }
            this.prepare();
            this.userSession = session;
            this.rounded = 0;
            this.sessionUUID = session.uuid;
            await (async () => {
                if (this.setCurrentSessionID) {
                    this.setCurrentSessionID(session.uuid);
                }
                if (this.setCurrentSession) {
                    this.setCurrentSession(session);
                }
            })();
            this.saved = true;
            let model = "";
            switch (this.conf!.sessionLoadModel) {
                case historySessionModel.defaultModel:
                    model = this.conf!.defaultModel;
                    break;
                case historySessionModel.currentModel:
                    model = this.model!;
                    break;
                case historySessionModel.recordedModel:
                    model = session.model;
                    break;
            }
            this.model = model;
            if (this.setCurrentModel) {
                this.setCurrentModel(this.model);
            }
            this.config!.systemInstruction = session.instruction;
            let contents: Content[] = [];
            rawMessages.map((r) => {
                if (r.content && !(r.hasError === true)) {
                    if (!r.content.role) {
                        console.log(r);
                    }
                    contents = [...contents, r.content]
                }
            });
            this.session = this.client.chats.create({
                history: contents,
                model: model,
                config: this.config,
            });
            this.changeModel(this.model!);
            let isNew = false;
            let role: undefined | string = undefined;
            let idx = 0;
            this.systemInstruction = session.instruction;
            for (const rawMsg of rawMessages) {
                if (rawMsg.role && rawMsg.role != role) {
                    this.rounded = this.rounded + 1;
                    isNew = true;
                    role = rawMsg.role;
                }
                const { thinking, msgText, fcall } = this.createMessageText(rawMsg.content, rawMsg.groundMetadata);
                if (thinking || msgText || fcall || rawMsg.hasError) {
                    let msg: Message = {
                        role: rawMsg.role === "user" ? "user" : "assistant",
                        id: "",
                        message: msgText ? msgText : "",
                        thinking: thinking,
                        isError: rawMsg.role !== "user" && rawMsg.hasError ? rawMsg.hasError : false,
                        errInfo: rawMsg.role !== "user" && rawMsg.hasError && rawMsg.errInfo ? rawMsg.errInfo : "",
                        files: rawMsg.files ? rawMsg.files : [],
                        hasFuncCall: fcall ? fcall.length > 0 : false,
                        funcCalls: fcall ? fcall : [],
                        finished: true,
                        sessionID: session.uuid,
                    };
                    if (this.msgCtrl) {
                        this.msgCtrl(msg, isNew);
                    }
                    if (isNew) {
                        isNew = !isNew;
                    }
                }
                idx++;
            }
            if (this.rounded > 1) {
                this.rounded /= 2;
            }
            if (this.finshedLoadSession) {
                this.finshedLoadSession();
            }
        }
    }

    public updateSystemInstruction(instruction: string) {
        this.systemInstruction = instruction;
        this.config!.systemInstruction = this.systemInstruction;
        if (this.session) {
            const history = this.session.getHistory();
            this.session = this.client.chats.create({
                model: this.model!,
                history: history,
                config: this.config
            });
            if (!this.tmpSession) {
                updateSessionInstruction(this.sessionUUID!, instruction);
            }
        }
    }

    public registerMessageCtrlor(fn: messageAdder) {
        this.msgCtrl = fn;
    }

    public registerRefleshSessions(fn: () => void) {
        this.fleshSession = fn;
    }

    public registerSetCurrentSessionID(fn: (id: string) => void) {
        this.setCurrentSessionID = fn;
    }

    public registerSetCurrentSession(fn: (s: session | null) => void) {
        this.setCurrentSession = fn;
    }

    public registerClearMessages(fn: () => void) {
        this.clearMessags = fn;
    }

    public registerSetCurrentModel(fn: (m: string) => void) {
        this.setCurrentModel = fn;
    }

    public registerAbortMessage(fn: (key: string, cancel: MessageCancelFn) => void) {
        this.cancelMessage = fn;
    }
    public registerDeleteAbortMessage(fn: (key: string) => void) {
        this.deleteCancelMessage = fn;
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
    public registerFinishedLoadSession(fn: () => void) {
        this.finshedLoadSession = fn;
    }
}

let chatter: Chatter | null = null

export function geminiInit(conf: Config, isTemp: boolean = false) {
    if (!chatter) {
        chatter = new Chatter(conf, isTemp);
        if (callbacks.addMsg) {
            chatter.registerMessageCtrlor(callbacks.addMsg);
        }
        if (callbacks.cleanMsg) {
            chatter.registerClearMessages(callbacks.cleanMsg);
        }
        if (callbacks.refleshSessions) {
            chatter.registerRefleshSessions(callbacks.refleshSessions);
        }
        if (callbacks.setCurrentModel) {
            chatter.registerSetCurrentModel(callbacks.setCurrentModel);
        }
        if (callbacks.setCurrentSessionID) {
            chatter.registerSetCurrentSessionID(callbacks.setCurrentSessionID);
        }
        if (callbacks.setCurrentSssion) {
            chatter.registerSetCurrentSession(callbacks.setCurrentSssion);
        }
        if (callbacks.abortMessage) {
            chatter.registerAbortMessage(callbacks.abortMessage);
        }
        if (callbacks.deleteAbortMessage) {
            chatter.registerDeleteAbortMessage(callbacks.deleteAbortMessage);
        }
        if (callbacks.finsedLoadSession) {
            chatter.registerFinishedLoadSession(callbacks.finsedLoadSession);
        }
    }
}

export async function sendMessage(msg: string, files?: FileInfo[]) {
    if (chatter) {
        chatter.sendMessageStream(msg, files);
    }
}

export async function loadSession(id: string) {
    if (chatter) {
        chatter.loadSession(id);
    }
}

export function registerAddMessage(fn: messageAdder) {
    callbacks.addMsg = fn;
    if (chatter) {
        chatter.registerMessageCtrlor(fn);
    }
}

export function registerFleshSessionList(fn: () => void) {
    callbacks.refleshSessions = fn;
    if (chatter) {
        chatter.registerRefleshSessions(fn);
    }
}

export function registerSetCurrentSessionID(fn: (id: string) => void) {
    callbacks.setCurrentSessionID = fn;
    if (chatter) {
        chatter.registerSetCurrentSessionID(fn);
    }
}

export function registerSetCurrentSession(fn: (s: session | null) => void) {
    callbacks.setCurrentSssion = fn;
    if (chatter) {
        chatter.registerSetCurrentSession(fn);
    }
}

export function registerClearMessages(fn: () => void) {
    callbacks.cleanMsg = fn;
    if (chatter) {
        chatter.registerClearMessages(fn);
    }
}

export function newSession() {
    if (chatter) {
        chatter.newSession();
    }
}

export function changeModel(model: string) {
    if (chatter) {
        chatter.changeModel(model);
    }
}

export function useTool(tool: GeminiToolType[], functions?: FunctionDeclaration[]) {
    if (chatter) {
        chatter.toolSet(tool, functions);
    }
}

export function updateSystemInstruction(instruction: string) {
    if (chatter) {
        chatter.updateSystemInstruction(instruction);
    }
}

export function updateSessionTitle(id: string, title: string) {
    if (chatter) {
        chatter.updateSessionTitle(id, title);
    }
}

export function registerSetCurrentModel(fn: (m: string) => void) {
    callbacks.setCurrentModel = fn;
    if (chatter) {
        chatter.registerSetCurrentModel(fn);
    }
}

export function updateConf(conf: Config) {
    if (chatter) {
        chatter.updateConf(conf);
    }
}

export function registerAbortMessage(fn: (key: string, cancel: MessageCancelFn) => void) {
    callbacks.abortMessage = fn;
    if (chatter) {
        chatter.registerAbortMessage(fn);
    }
}

export function registerFinishedLoadSession(fn: () => void) {
    callbacks.finsedLoadSession = fn;
    if (chatter) {
        chatter.registerFinishedLoadSession(fn);
    }
}

export function registerDeleteAbortMessage(fn: (key: string) => void) {
    callbacks.deleteAbortMessage = fn;
    if (chatter) {
        chatter.registerDeleteAbortMessage(fn);
    }
}
