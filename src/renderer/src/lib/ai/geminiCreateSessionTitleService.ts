import { Content, GenerateContentConfig, GoogleGenAI } from "@google/genai";
import { Config } from "../data/config";
import { session } from "@shared/types/session";
import { getModelVersionNumber } from "../util/model";
import { setSessionTitle } from "../data/db";


export class SessionTitleService {
    public static async createSessionTitle(history: Content[], conf: Config, userSession: session) {
        let config: GenerateContentConfig = {
            thinkingConfig: {
                includeThoughts: false,
            }
        }
        if (getModelVersionNumber(conf.namedSessionModel) < 2.5) {
            config.thinkingConfig = undefined;
        }
        if (conf.endPoint) {
            config.httpOptions = {
                baseUrl: conf.endPoint,
            }
        }
        // Remove inlineData from history content
        const tmpHistory = history.map(content => {
            if (content.parts) {
                content.parts = content.parts.filter(part => !part.inlineData);
            }
            return content;
        });
        const cleanedHistory = tmpHistory.filter(c => c.parts && c.parts.length > 0);
        if (cleanedHistory.length < 2) {
            return;
        }
        let c = new GoogleGenAI({
            apiKey: conf.balance ? conf.balanceApikeys![0].key : conf.ApiKeyInuse!.key,

        });
        let s = c.chats.create({
            history: cleanedHistory,
            model: conf.namedSessionModel,
            config: config,
        });
        const msgs = await s.sendMessage({
            message: "用对话使用的主要语言为上述对话取一个简短的标题,只需要输出标题，不需要其他附带的信息和格式"
        });
        let text = msgs.text;
        if (text) { await setSessionTitle(userSession.uuid, text.trim()); }
        return text;
    }
}