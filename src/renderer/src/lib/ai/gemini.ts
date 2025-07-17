import { FunctionDeclaration } from "@google/genai";
import { FileInfo, Message, MessageCancelFn } from "@shared/types/message";
import { GeminiToolType, session } from "@shared/types/session";
import { Config } from "../data/config";
import { GeminiClient } from "./geminiClitent";
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
    loadMessageList?: (messages: Message[], id: string) => void,
}

let callbacks: callbackRegister = {};

export type messageAdder = (msg: Message, flag: boolean, supports?: Map<string, string>) => void;


let chatter: GeminiClient | null = null

export function geminiInit(conf: Config, isTemp: boolean = false) {
    if (!chatter) {
        chatter = new GeminiClient(conf, isTemp);
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

export function registerLoadMessageList(fn: (messages: Message[], id: string) => void) {
    callbacks.loadMessageList = fn;
    if (chatter) {
        chatter.registerLoadMessageList(fn);
    }
}
