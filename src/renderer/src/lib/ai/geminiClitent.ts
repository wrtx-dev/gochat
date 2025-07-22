import { Candidate, Content, FinishReason, FunctionCall, FunctionDeclaration, GenerateContentResponse, GoogleGenAI, Part } from "@google/genai";
import { GeminiToolType, session } from "@shared/types/session";
import { ChatSession } from "./chatSession";
import { messageAdder } from "./gemini";
import { Config } from "../data/config";
import { FileInfo, Message, MessageCancelFn } from "@shared/types/message";
import { addNewSessions, addRawMessage, getSession, rawMessage, updateSessionLastUpdate } from "../data/db";
import { SessionTitleService } from "./geminiCreateSessionTitleService";
import { createMessageListFromRawMessage, createMessageText, genFileContent } from "./utils";
import { runMcpTools } from "./mcpService";


export class GeminiClient {
    private client: GoogleGenAI;
    private sessionState?: {
        sessionID: string,
        saved: boolean,
        session?: session,
    }
    private session?: ChatSession;
    private model?: string;
    private msgCtrl?: messageAdder;
    private refreshSession?: () => void;
    private setCurrentSessionID?: (id: string) => void;
    private setCurrentSession?: (s: session | null) => void;
    private setCurrentModel?: (m: string) => void;
    private apiKey?: string;
    private clearMessages?: () => void;
    private conf?: Config;
    private messageTurn?: number;
    private cancelMessage?: (key: string, cancel: MessageCancelFn) => void;
    private deleteCancelMessage?: (key: string) => void;
    private finishedLoadSession?: () => void;
    private tmpSession: boolean;
    private loadMessageList?: (messages: Message[], id: string) => void;

    private prepare() {
        this.session = undefined;
        this.sessionState = undefined;
        this.messageTurn = undefined;


    }
    constructor(conf: Config, tmp: boolean) {
        this.conf = conf;
        this.client = new GoogleGenAI({
            apiKey: conf.apikey
        });
        this.apiKey = conf.apikey;
        this.tmpSession = tmp;
        this.newSession();

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

    private createAssistantMsg(firstResponse: boolean, msgText: string, thinking?: string, fcall?: FunctionCall[], sessionID?: string, supports?: Map<string, string>, renderedContent?: string) {
        let msg: Message = {
            role: "assistant",
            id: "",
            message: `${msgText ? msgText : ""}`,
            thinking: thinking,
            isError: false,
            errInfo: "",
            files: [],
            hasFuncCall: fcall ? fcall.length > 0 : false,
            funcCalls: fcall ? [...fcall] : [],
            finished: false,
            sessionID: sessionID,
            renderedContent: renderedContent,
        };
        if (this.msgCtrl) {
            this.msgCtrl(msg, firstResponse, supports);
        }
    }

    private async saveModelRawMessage(v: Candidate) {
        const modelMessage: rawMessage = {
            content: v.content,
            groundMetadata: v.groundingMetadata,
            sessionID: this.sessionState!.sessionID,
            role: "model"
        }
        if (!this.tmpSession) {
            await addRawMessage(modelMessage);
        }
    }

    private async handleResponseProcessing(firstResponse: boolean, response: Promise<AsyncGenerator<GenerateContentResponse, any, any> | undefined>, sessionID: string) {
        if (!response) {
            throw new Error("no response");
        }
        let hasError = false;
        let funcs: FunctionCall[] = [];
        let errInfo: string | undefined = undefined;
        try {
            let hasContent = false;
            const resp = await response;
            if (!resp) {
                throw new Error("no response");
            }
            for await (const chunk of resp) {
                if (!chunk.candidates) {
                    continue;
                }
                for (const v of chunk.candidates) {
                    hasContent = true;

                    const { thinking, msgText, fcall, supports, renderedContent } = createMessageText(v.content, v.groundingMetadata);
                    if (msgText || thinking || fcall) {
                        this.createAssistantMsg(firstResponse, msgText ? msgText : "", thinking, fcall, sessionID, supports, renderedContent);
                        if (firstResponse) {
                            firstResponse = !firstResponse;
                        }
                    }
                    if (fcall) {
                        funcs = [...funcs, ...fcall]
                    }
                    if (!this.tmpSession) {
                        await this.saveModelRawMessage(v);
                    }
                    if (v.finishReason && v.finishReason !== FinishReason.STOP) {
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
        let sessionID: string = this.sessionState ? this.sessionState.sessionID : crypto.randomUUID();
        let userSession: session | null = null;
        if (this.sessionState!.saved) {
            userSession = this.sessionState!.session!;
        } else {
            userSession = {
                model: this.model!,
                apikey: this.apiKey!,
                createTime: Math.floor(Date.now() / 1000),
                updateTime: Math.floor(Date.now() / 1000),
                sessionName: "unname",
                named: false,
                uuid: sessionID,
                instruction: this.session!.getSystemInstruction(),
            };
            this.sessionState!.session = userSession;


            if (this.setCurrentSessionID) {
                this.setCurrentSessionID(sessionID);
            }
            if (this.setCurrentSession) {
                this.setCurrentSession(userSession);
            }

            this.sessionState!.saved = true;
            // this.sessionUUID = sessionID;
            if (!this.tmpSession) {
                await addNewSessions(userSession!);
                if (this.refreshSession) {
                    this.refreshSession();
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
        // await (async () => {
        //     if (!this.sessionState!.saved && this.setCurrentSessionID) {
        //         this.setCurrentSessionID(sessionID);
        //     }
        // })();
        return { sessionID, userSession };
    }

    private async saveUserRawMessage(contents: Part[] | undefined, msg: string, sessionId: string, fileInfos?: FileInfo[]) {
        const userRawMsg: rawMessage = {
            content: contents ? { role: "user", parts: contents } : { role: "user", parts: [{ text: msg }] },
            sessionID: sessionId,
            files: fileInfos ? fileInfos : undefined,
            role: "user",
        }

        if (!this.tmpSession) {
            await addRawMessage(userRawMsg);
        }
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
        const { fileInfos, contents } = await genFileContent(msg, files);
        let response = chatSession.sendMessageStream(contents ? contents : msg, abort);
        let messageTurn = !this.messageTurn ? 1 : this.messageTurn + 1;

        this.addUserMsg(msg, fileInfos, sessionID);
        let firstResponse = true;

        await this.saveUserRawMessage(contents, msg, sessionID, fileInfos);
        let hasError = false;
        let funcs: FunctionCall[] = [];

        let eInfo: undefined | string = undefined;
        let again = false;
        do {
            again = false;
            const { error, functions, first, errInfo } = await this.handleResponseProcessing(firstResponse, response, sessionID);
            eInfo = errInfo;
            firstResponse = first;
            hasError = error;
            this.setLastMsg(firstResponse, hasError, eInfo, sessionID);
            funcs = [...functions];
            if (!hasError && funcs.length > 0) {
                again = true;
                const parts = await runMcpTools(funcs);

                const funcMsg: rawMessage = {
                    content: { parts: parts, role: "user" },
                    sessionID: sessionID,
                    files: undefined,
                    role: "user",
                }
                if (!this.tmpSession) {
                    await addRawMessage(funcMsg);
                }
                response = this.session.sendMessageStream(parts, abort);
                firstResponse = true;
            }

        } while (again);


        if (this.deleteCancelMessage) {
            this.deleteCancelMessage(sessionID);
        }

        if (this.sessionState?.sessionID === sessionID) {
            this.messageTurn = messageTurn;
        }
        if (!this.tmpSession) {
            await this.updateSessionAfterMessage(sessionID, conf, messageTurn, userSession, hasError, userSession.named ? undefined : chatSession.getHistory());
        }
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
            this.createSessionTitle(history, conf, userSession);
            if (userSession.uuid === this.sessionState?.sessionID) {
                this.sessionState!.session!.named = true;
            }
        }
    }

    private async updateSession(sessionID: string) {

        await updateSessionLastUpdate(sessionID);
        if (this.refreshSession) {
            this.refreshSession();
        }

    }

    private async createSessionTitle(history: Content[], conf: Config, userSession: session) {
        const title = await SessionTitleService.createSessionTitle(history, conf, userSession);
        if (title) {
            this.updateSessionTitle(userSession.uuid, title);
        }
    }

    public async updateSessionTitle(id: string, title: string | undefined) {
        if (this.sessionState && this.sessionState.session && title && this.sessionState.session.uuid === id) {
            this.sessionState.session.sessionName = title;
        }
        if (this.refreshSession) {
            this.refreshSession();
        }
    }

    public changeModel(model: string) {
        this.model = model;
        this.session?.changeModel(model);
    }

    public toolSet(tools: GeminiToolType[], functions?: FunctionDeclaration[]) {
        this.session?.setTools(tools, functions);
    }

    public async newSession() {
        if (!this.model) {
            this.model = this.conf!.defaultModel;
        }
        this.prepare();
        this.sessionState = {
            sessionID: crypto.randomUUID(),
            saved: false,
        }
        if (this.conf!.newSessionModelUseDefault) {
            this.model = this.conf!.defaultModel;
            if (this.setCurrentModel) {
                this.setCurrentModel(this.model!);
            }
        }
        if (this.setCurrentSessionID) {
            this.setCurrentSessionID(this.sessionState.sessionID);
        }
        if (this.setCurrentSession) {
            this.setCurrentSession(null);
        }
        this.session = await ChatSession.createSession(this.client, this.conf!, this.sessionState.sessionID, this.model)
        if (this.clearMessages) {
            this.clearMessages();
        }
    }

    public updateConf(conf: Config) {
        this.conf = conf;
        this.session?.updateConfig(conf);

    }

    private async resetMessages() {
        if (this.clearMessages) {
            this.clearMessages();
        }
    }

    private async changeCurrenSession(s: session) {
        this.sessionState = {
            sessionID: s.uuid,
            session: s,
            saved: true,
        };
        if (this.setCurrentSessionID) {
            this.setCurrentSessionID(s.uuid);
        }
        if (this.setCurrentSession) {
            this.setCurrentSession(s);
        }
        if (this.setCurrentModel) {
            this.setCurrentModel(this.session!.getModel());
        }
    }

    private loadFinished() {
        if (this.finishedLoadSession) {
            this.finishedLoadSession();
        }
    }


    private async setHistoryMessage(s: session) {
        const { messages, messageTurn } = await createMessageListFromRawMessage(s.uuid);
        if (this.loadMessageList) {
            this.loadMessageList(messages, s.uuid);
            this.messageTurn = messageTurn;
        }
    }

    public async loadSession(id: string) {
        const session = await getSession(id);
        if (session) {
            this.prepare();
            await this.resetMessages();
            this.session = await ChatSession.createSession(this.client, this.conf!, session, this.model);
            await this.changeCurrenSession(session);
            await this.setHistoryMessage(session);
            this.loadFinished();
            this.model = this.sessionState!.session!.model;
        }
    }

    public updateSystemInstruction(instruction: string) {
        this.session?.updateSystemInstruction(instruction);
    }

    public registerMessageCtrlor(fn: messageAdder) {
        this.msgCtrl = fn;
    }

    public registerRefleshSessions(fn: () => void) {
        this.refreshSession = fn;
    }

    public registerSetCurrentSessionID(fn: (id: string) => void) {
        this.setCurrentSessionID = fn;
    }

    public registerSetCurrentSession(fn: (s: session | null) => void) {
        this.setCurrentSession = fn;
    }

    public registerClearMessages(fn: () => void) {
        this.clearMessages = fn;
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

    public registerFinishedLoadSession(fn: () => void) {
        this.finishedLoadSession = fn;
    }

    public registerLoadMessageList(fn: (messages: Message[], id: string) => void) {
        this.loadMessageList = fn;
    }
}