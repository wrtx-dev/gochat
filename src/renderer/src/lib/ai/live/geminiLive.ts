import { Config } from "@renderer/lib/data/config";
import { GeminiLiveClient } from "./geminiLiveClient";


let liveClient: GeminiLiveClient | null = null;


export function geminiLiveInit(conf: Config) {
    if (liveClient) {
        return;
    }
    liveClient = new GeminiLiveClient(conf);
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