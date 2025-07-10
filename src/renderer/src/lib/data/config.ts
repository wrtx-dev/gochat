import { EnumQuickWinHotKey } from "@shared/types/config";

export enum safetyLevel {
    NA = 0,
    BLOCK_OFF,
    BLOCK_NONE,
    BLOCK_FEW,
    BLOCK_SOME,
    BLOCK_MOST,
}

export enum EnumMessageSendKey {
    Enter = 0,
    CtrlEnter,
    AltEnter
}

const safetyString: string[] = ["modelDefault", "off", "blockNone", "blockFew", "blockSome", "blockMost"];
export const safteyLevelToStr = (level: safetyLevel) => {
    return safetyString[level];
}

const MessageSendKeyString: string[] = ["Enter", "Ctrl+Enter", "Alt+Enter"];
export const EnumMessageSendKeyToString = (i: EnumMessageSendKey) => {
    return MessageSendKeyString[i]
}


export interface Config {
    id?: number,
    lastModified?: number,
    apikey: string,
    endPoint?: string,
    systemInstruction?: string,
    default?: boolean,
    provider?: string,
    uuid: string,
    defaultModel: string,
    temprature: number,
    topP: number
    sessionLoadModel: historySessionModel,
    newSessionModelUseDefault: boolean
    autoGenSessionName: boolean
    genSessionNameAfter: number
    maxOutputToken: number
    Harassment: safetyLevel
    HateSpeech: safetyLevel
    SexuallyExplicit: safetyLevel
    Dangerous: safetyLevel
    CivicIntegrity: safetyLevel
    lang: string
    showThought?: boolean
    disableThought?: boolean
    dynThought?: boolean
    thoughtCoast?: number
    namedSessionModel: string,
    showTray: boolean,
    createQuickWindow: boolean,
    sendKey: EnumMessageSendKey,
    quickWinHotkey: EnumQuickWinHotKey,
}

export enum historySessionModel {
    defaultModel = 0,
    recordedModel = 1,
    currentModel = 2,
}


export function historySessionModeltoString(v: historySessionModel) {
    switch (v) {
        case historySessionModel.defaultModel:
            return "default model";
        case historySessionModel.recordedModel:
            return "session's model";
        case historySessionModel.currentModel:
            return "current model";
    }
}
export function newConfigDefault() {
    const conf: Config = {
        apikey: "",
        uuid: "",
        defaultModel: "models/gemini-2.5-flash",
        temprature: 0,
        topP: 0,
        sessionLoadModel: historySessionModel.recordedModel,
        newSessionModelUseDefault: false,
        autoGenSessionName: false,
        genSessionNameAfter: 0,
        Harassment: safetyLevel.NA,
        HateSpeech: safetyLevel.NA,
        SexuallyExplicit: safetyLevel.NA,
        Dangerous: safetyLevel.NA,
        CivicIntegrity: safetyLevel.NA,
        lang: "",
        maxOutputToken: 65536,
        namedSessionModel: "models/gemini-2.5-flash",
        showTray: true,
        createQuickWindow: true,
        sendKey: EnumMessageSendKey.Enter,
        quickWinHotkey: EnumQuickWinHotKey.CtrlAltSpace,
    }
    return conf;
}

export async function saveConfig(conf: Config) {
    if (conf.apikey !== "") {
        const confData = JSON.stringify(conf);
        localStorage.setItem("gemini_config", confData);
    }
}

export async function loadConfig() {
    let gconf: Config | null = null;
    const config = await localStorage.getItem("gemini_config");
    if (config !== null) {
        gconf = JSON.parse(config) as Config;
    }
    return gconf
}

export { EnumQuickWinHotKey };
