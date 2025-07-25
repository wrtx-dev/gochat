import { GoogleGenAI, LiveServerMessage, Modality, Session } from "@google/genai";
import { Config } from "@renderer/lib/data/config";
import { LiveMessageCallback } from "./geminiLive";


export class GeminiLiveClient {
    private client: GoogleGenAI;
    private model?: string;
    private conf: Config;
    private liveSession?: Session;
    private callbacks?: LiveMessageCallback;
    private isConnected = false;



    constructor(conf: Config) {
        this.conf = conf;
        this.client = new GoogleGenAI({
            apiKey: this.conf.apikey,
        });

    }


    public registerCallbacks(callbacks: LiveMessageCallback) {
        this.callbacks = callbacks;
    }

    public async connect(model: string) {
        this.model = model;
        this.liveSession = await this.client.live.connect({
            model: this.model,
            callbacks: {
                onopen: () => {
                    console.log("Live session connected:", this.model);
                    if (this.callbacks && this.callbacks.handleConnectdStatus) {
                        this.callbacks.handleConnectdStatus(true);
                    }
                    this.isConnected = true;
                },
                onmessage: (e: LiveServerMessage) => {

                    if (e.setupComplete) {
                        console.log("Live session setup complete:", e);
                    }
                    if (e.goAway) {
                        console.debug('Time left: %s\n', e.goAway.timeLeft);
                    }
                    if (e.serverContent) {
                        const content = e.serverContent;
                        // console.log("Received live message:", content);
                        if (content.modelTurn && content.modelTurn.parts) {
                            const parts = content.modelTurn.parts;
                            parts.forEach((part) => {
                                if (part.inlineData && part.inlineData.data && part.inlineData.data.length > 0 && part.inlineData.mimeType) {
                                    if (this.callbacks && this.callbacks.addLiveMessage) {
                                        this.callbacks.addLiveMessage({
                                            role: "model",
                                            text: part.text || "",
                                            audio: {
                                                data: part.inlineData.data,
                                                mimeType: part.inlineData.mimeType,
                                            },
                                        });
                                    }
                                }
                            });
                        }

                        if (e.serverContent.generationComplete) {
                            if (this.callbacks && this.callbacks.addLiveMessage) {
                                console.log("Live message complete:", e.serverContent.turnComplete);
                                this.callbacks.addLiveMessage({
                                    role: "model",
                                    complete: true,
                                });
                            }
                        }
                    } else {
                        console.log("Received message:", e);
                    }
                },
                onclose: (e) => {
                    console.log("Live session closed. case:", e.reason);
                    if (this.callbacks && this.callbacks.handleConnectdStatus) {
                        this.callbacks.handleConnectdStatus(false);
                    }
                    this.isConnected = false;
                },
                onerror: (e) => {
                    console.error("Live session error:", e);
                }
            },
            config: {
                httpOptions: {
                    timeout: 360000, // 360 seconds timeout
                },

                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Zephyr",
                        }
                    },
                    languageCode: "cmn-CN"
                },
                contextWindowCompression: {
                    triggerTokens: '25600',
                    slidingWindow: { targetTokens: '12800' },
                },
            }


        })
    }



    public async sendMessage(message: string) {
        if (!this.liveSession) {
            throw new Error("Live session is not connected.");
        }
        if (this.callbacks && this.callbacks.addLiveMessage) {
            this.callbacks.addLiveMessage({
                role: "user",
                text: message,
                complete: true,
            });
        }
        this.liveSession.sendClientContent({
            turns: [{ text: message }],
            turnComplete: true,
        })
        // this.liveSession.sendRealtimeInput({
        //     text: message,
        // });
    }

    public async disconnect() {
        if (this.liveSession && this.isConnected) {
            this.liveSession.close();
        }
    }
}
