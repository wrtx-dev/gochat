import { Content, FinishReason, FunctionCall, FunctionDeclaration, GenerateContentResponse, GoogleGenAI, GroundingMetadata, Part } from "@google/genai";
import { GeminiToolType, session } from "@shared/types/session";
import { ChatSession } from "./chatSession";
import { messageAdder } from "./gemini";
import { Config } from "../data/config";
import { FileInfo, Message, MessageCancelFn } from "@shared/types/message";
import { isYoutubeURI } from "../util/misc";
import { getMimeType, readFile } from "../util/files";
import { addNewSessions, addRawMessage, getRawMessageBySessionID, getSession, rawMessage, updateSessionLastUpdate } from "../data/db";
import { runMcpTool } from "../util/mcpIpc";
import { SessionTitleService } from "./geminiCreateSessionTitleService";


export class GeminiClient {
    private client: GoogleGenAI;
    private session?: ChatSession;
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

    }
    constructor(conf: Config, tmp: boolean) {
        this.conf = conf;
        this.client = new GoogleGenAI({
            apiKey: conf.apikey
        });
        this.saved = false;
        this.apiKey = conf.apikey;
        this.prepare();
        this.tmpSession = tmp;
        this.newSession();

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

    private async processResponse(firstResponse: boolean, response: Promise<AsyncGenerator<GenerateContentResponse, any, any> | undefined>, sessionID: string) {
        if (!response) {
            throw new Error("no response");
        }
        // let rawModelMessages: rawMessage[] = [];
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
        let sessionID: string = this.sessionUUID!;
        let userSession: session | null = null;
        if (this.saved) {
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
                instruction: this.session!.getSystemInstruction(),
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
        const response = chatSession.sendMessageStream(contents ? contents : msg, abort);
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

    private async processFuncsUserMsg(chat: ChatSession, parts: Part[], sessionID: string, conf: Config, abort?: AbortController) {
        const response = chat.sendMessageStream(parts, abort);
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
        const title = await SessionTitleService.createSessionTitle(history, conf, userSession);
        if (title) {
            this.updateSessionTitle(userSession.uuid, title);
        }
    }

    public async updateSessionTitle(id: string, title: string | undefined) {
        if (this.userSession && title && this.userSession.uuid === id) {
            this.userSession.sessionName = title;
        }
        if (this.fleshSession) {
            this.fleshSession();
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
        this.sessionUUID = crypto.randomUUID();
        if (this.conf!.newSessionModelUseDefault) {
            this.model = this.conf!.defaultModel;
            if (this.setCurrentModel) {
                this.setCurrentModel(this.model!);
            }
        }
        this.saved = false;
        if (this.setCurrentSessionID) {
            this.setCurrentSessionID(this.sessionUUID!);
        }
        if (this.setCurrentSession) {
            this.setCurrentSession(null);
        }
        this.session = await ChatSession.createSession(this.client, this.conf!, this.sessionUUID!, this.model)
        if (this.clearMessags) {
            this.clearMessags();
        }
    }

    public updateConf(conf: Config) {
        this.conf = conf;
        this.session?.updateConfig(conf);

    }

    public async loadSession(id: string) {
        const session = await getSession(id);
        if (session) {
            if (this.clearMessags) {
                await (async () => {
                    this.clearMessags!();
                })();
            }

            this.saved = true;

            this.session = await ChatSession.createSession(this.client, this.conf!, session, this.model);
            const rawMessages = await getRawMessageBySessionID(id)
            await (async () => {
                if (this.setCurrentSessionID) {
                    this.setCurrentSessionID(session.uuid);
                }
                if (this.setCurrentSession) {
                    this.setCurrentSession(session);
                }
            })();

            if (this.setCurrentModel) {
                this.setCurrentModel(this.session!.getModel());
            }
            this.rounded = 0;
            let isNew = false;
            let role: undefined | string = undefined;
            let idx = 0;
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
        this.session?.updateSystemInstruction(instruction);
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

    public registerFinishedLoadSession(fn: () => void) {
        this.finshedLoadSession = fn;
    }
}