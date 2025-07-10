import { create } from "zustand";
import { GeminiToolType, session } from "@shared/types/session";
import { modelSimpleInfo } from "../util/model";
import { MessageCancelFn } from "@shared/types/message";

export interface UIState {
    hideSider: boolean,
    currentSessionID: string,
    currentSession: session | null,
    currentModel: string,
    sessions: session[],
    sessionFilter: string,
    chatPageAlwaysOnTop: boolean,
    models: modelSimpleInfo[] | null;
    currentTool: GeminiToolType[];
    showPromptEditor;
    prompt: string;
    transPromptEditor: boolean;
    isMac: boolean,
    messageText: string,
    messageCancel: Map<string, MessageCancelFn>,
    storeSessionID?: string,
    setHideSider: (flag: boolean) => void,
    setCurrentSessionID: (id: string) => void,
    setSessions: (sessions: session[]) => void,
    setSessionFilter: (f: string) => void,
    setChatPageAlwaysOnTop: (flag: boolean) => void,
    setModels: (models: modelSimpleInfo[] | null) => void,
    setCurrentModel: (model: string) => void,
    setCurrentTool: (tool: GeminiToolType[]) => void,
    setShowPromptEditor: (flag: boolean) => void,
    setCurrentSession: (s: session | null) => void,
    setPrompt: (p: string) => void,
    setTransPromptEditor: (flag: boolean) => void,
    setIsMac: (flag: boolean) => void,
    setMessageText: (text: string) => void,
    addMessageCancel: (key: string, fn: MessageCancelFn) => void,
    deleteMessageCancel: (key: string) => void,
    setStoreSessionID: (s: undefined | string) => void,
}


export const uiState = create<UIState>((set) => ({
    hideSider: false,
    currentSessionID: "",
    currentSession: null,
    sessions: [],
    sessionFilter: "",
    chatPageAlwaysOnTop: false,
    models: null,
    currentModel: "",
    currentTool: [],
    showPromptEditor: false,
    transPromptEditor: true,
    prompt: "",
    isMac: false,
    messageText: "",
    messageCancel: new Map<string, MessageCancelFn>(),
    storeSessionID: undefined,
    setHideSider: (flag: boolean) => set((state) => ({ ...state, hideSider: flag })),
    setCurrentSessionID: (id: string) => set((state) => ({ ...state, currentSessionID: id })),
    setSessions: (sessions: session[]) => set((state) => ({ ...state, sessions: sessions })),
    setSessionFilter: (f: string) => set((state) => ({ ...state, sessionFilter: f })),
    setChatPageAlwaysOnTop: (flag: boolean) => set((state) => ({ ...state, chatPageAlwaysOnTop: flag })),
    setModels: (models: null | modelSimpleInfo[]) => set((state) => ({ ...state, models: models })),
    setCurrentModel: (model: string) => set((state) => ({ ...state, currentModel: model })),
    setCurrentTool: (tool: GeminiToolType[]) => set((state) => ({ ...state, currentTool: tool })),
    setShowPromptEditor: (flag: boolean) => set((state) => ({ ...state, showPromptEditor: flag })),
    setCurrentSession: (s: session | null) => set((state) => ({ ...state, currentSession: s })),
    setPrompt: (p: string) => set((state) => ({ ...state, prompt: p })),
    setTransPromptEditor: (flag: boolean) => set((state) => ({ ...state, transPromptEditor: flag })),
    setIsMac: (flag: boolean) => set((state) => ({ ...state, isMac: flag })),
    setMessageText: (text: string) => set((state) => ({ ...state, messageText: text })),
    addMessageCancel: (key: string, cancel: MessageCancelFn) => set((state) => {
        let messageCancelMap = state.messageCancel;
        messageCancelMap = messageCancelMap.set(key, cancel);
        return {
            ...state,
            messageCancel: new Map(messageCancelMap),
        }
    }),
    deleteMessageCancel: (key: string) => set((state) => {
        let messageCancelMap = state.messageCancel;
        messageCancelMap.delete(key);
        return {
            ...state,
            messageCancel: new Map(messageCancelMap),
        }
    }),
    setStoreSessionID: (s: undefined | string) => set(state => ({ ...state, storeSessionID: s }))
}));