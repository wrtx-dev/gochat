import { GoogleGenAI, LiveServerMessage, Session } from "@google/genai";
import { Config } from "@renderer/lib/data/config";


export class GeminiLiveClient {
    private client: GoogleGenAI;
    private model?: string;
    private conf: Config;
    private liveSession?: Session;


    constructor(conf: Config) {
        this.conf = conf;
        this.client = new GoogleGenAI({
            apiKey: this.conf.apikey,
        });

    }

    public async connect(model: string) {
        this.model = model;
        this.liveSession = await this.client.live.connect({
            model: this.model,
            callbacks: {
                onopen: () => {
                    console.log("Live session connected:", this.model);
                },
                onmessage: function (e: LiveServerMessage): void {
                    if (e.serverContent) {
                        const content = e.serverContent;
                        console.log("Received live message:", content);
                        if (content.modelTurn && content.modelTurn.parts) {
                            let parts = content.modelTurn.parts;
                        }

                    } else {
                        console.log("Received message:", e);
                    }
                },
            }
        })
    }

    public async sendMessage(message: string) {
        if (!this.liveSession) {
            throw new Error("Live session is not connected.");
        }
        this.liveSession.sendRealtimeInput({
            text: message,
        });
    }
}