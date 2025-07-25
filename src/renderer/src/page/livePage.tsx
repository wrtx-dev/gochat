import LiveControlBar from "@renderer/components/live/liveControlBar";
import LiveMessageArea from "@renderer/components/live/liveMessageArea";
import LiveAppTitleBar from "@renderer/components/live/titlebar"
import { loadConfig } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";
import { useEffect } from "react";


export default function LiveApp() {
    const setConfig = globalConfig(state => state.setConfig);
    const liveInit = async () => {
        const conf = await loadConfig();
        setConfig(conf);

    }
    useEffect(() => {
        (async () => {
            await liveInit();
            // await geminiLiveConnect("gemini-2.5-flash-preview-native-audio-dialog");


        })();
    }, []);
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white gap-y-0.5">
            <LiveAppTitleBar />
            {/* <LiveMessageBox />
            <MessageInputBox /> */}
            <div className="flex flex-row flex-1 w-full overflow-hidden">
                <LiveMessageArea />
                <LiveControlBar />
            </div>
        </div>
    )
}