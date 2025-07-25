import { FunctionCall } from "@google/genai";

export interface Message {
    rawID?: number,
    role: "user" | "assistant" | "system" | "model",
    id: string,
    message: string,
    thinking?: string,
    isError: boolean,
    errInfo: string,
    files: FileInfo[],
    hasFuncCall: boolean,
    funcCalls: FunctionCall[],
    finished: boolean,
    sessionID?: string,
    renderedContent?: string,
}
export interface FileInfo {
    path: string,
    fileType: string,
    youtube?: string,
    ytStart?: number,
    ytStop?: number,
    ytFps?: number,
}

export type MessageCancelFn = undefined | (() => void);

export type AudioPart = {
    data?: string,
    mimeType?: string,
}

export type LiveMessage = {
    role: "user" | "model",
    text?: string,
    audio?: AudioPart,
    complete?: boolean,
    dataurl?: string,
    played?: boolean,
}