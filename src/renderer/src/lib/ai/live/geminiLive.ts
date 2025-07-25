import { Config } from "@renderer/lib/data/config";
import { GeminiLiveClient } from "./geminiLiveClient";
import { LiveMessage } from "@shared/types/message";


let liveClient: GeminiLiveClient | null = null;

export type LiveMessageCallback = {
    addLiveMessage?: (message: LiveMessage) => void;
    handleConnectdStatus?: (flag: boolean) => void;
}

let callbacks: LiveMessageCallback = {};

export function geminiLiveInit(conf: Config) {
    if (liveClient) {
        return;
    }
    liveClient = new GeminiLiveClient(conf);
    liveClient.registerCallbacks(callbacks);
}

export async function geminiLiveConnect(model: string) {
    if (liveClient) {
        await liveClient.connect(model);
    } else {
        throw new Error("Gemini Live Client is not initialized.");
    }
}

export async function geminiLiveSendMessage(message: string) {
    if (liveClient) {
        await liveClient.sendMessage(message);
    } else {
        throw new Error("Gemini Live Client is not initialized.");
    }
}

export function registerAddLiveMessage(fn: (message: LiveMessage) => void) {
    callbacks.addLiveMessage = fn;
    if (liveClient) {
        liveClient.registerCallbacks(callbacks);
    }
}

export function registerHandleConnectedStatus(fn: (flag: boolean) => void) {
    callbacks.handleConnectdStatus = fn;
    if (liveClient) {
        liveClient.registerCallbacks(callbacks);
    }
}

export async function geminiLiveDisconnect() {
    if (liveClient) {
        await liveClient.disconnect();
    }
}