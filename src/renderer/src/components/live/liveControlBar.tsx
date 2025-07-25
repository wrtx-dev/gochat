import { liveState } from "@renderer/lib/state/liveState";
import { Button } from "../ui/button";
import { useCallback, useEffect } from "react";
import { globalConfig } from "@renderer/lib/state/confState";
import { geminiLiveConnect, geminiLiveDisconnect, geminiLiveInit, registerHandleConnectedStatus } from "@renderer/lib/ai/live/geminiLive";


export default function LiveControlBar() {
    const connected = liveState(state => state.connected);
    const setConnected = liveState(state => state.setConnected);
    const conf = globalConfig(state => state.config);
    const handleConnected = useCallback((flag: boolean) => {
        setConnected(flag);
    }, [setConnected]);
    useEffect(() => {
        registerHandleConnectedStatus(handleConnected);
    }, [handleConnected]);
    return (
        <div className="flex flex-col w-56 h-full overflow-hidden border-l border-neutral-300/50 py-2 px-1">
            <div className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto">

            </div>
            <Button
                onClick={async () => {
                    // await geminiLiveConnect("gemini-2.5-flash-preview-native-audio-dialog");
                    if (connected) {
                        geminiLiveDisconnect();
                    } else {
                        if (conf) {
                            geminiLiveInit(conf);
                        }
                        await geminiLiveConnect("gemini-2.5-flash-live-preview");
                    }
                }}
                variant={connected ? "default" : "outline"}
                size={"lg"}
                className="w-full">
                {
                    connected ? "Disconnect" : "Connect"
                }

            </Button>
        </div>
    )
}