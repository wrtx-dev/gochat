import LiveMessageBox from "@renderer/components/live/liveMessageBox"
import MessageInputBox from "@renderer/components/live/sendbox"
import LiveAppTitleBar from "@renderer/components/live/titlebar"
import { geminiLiveConnect, geminiLiveInit } from "@renderer/lib/ai/live/geminiLive";
import { loadConfig } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";
import { useEffect } from "react";


export default function LiveApp() {
    const setConfig = globalConfig(state => state.setConfig);
    const liveInit = async () => {
        const conf = await loadConfig();
        setConfig(conf);
        if (conf) {
            geminiLiveInit(conf);
        }
    }
    useEffect(() => {
        (async () => {
            await liveInit();
            await geminiLiveConnect("gemini-2.5-flash-live-preview");
        })();
    }, []);
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white gap-y-0.5">
            <LiveAppTitleBar />
            <LiveMessageBox />
            <MessageInputBox />
        </div>
    )
}