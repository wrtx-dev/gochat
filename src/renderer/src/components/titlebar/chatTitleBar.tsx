import { SquarePen, Sidebar, Settings, Pin, Siren } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { uiState } from "@renderer/lib/state/uistate";
import { newSession } from "@renderer/lib/ai/gemini";
import ChatModelsMenu from "./models";
import { globalConfig } from "@renderer/lib/state/confState";
import TrafficLight from "./trafficLight";
import { stopMcpServers } from "@renderer/lib/util/mcpIpc";

export function ChatTitleBar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const doubleClickIgnore = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => e.stopPropagation();
    const setHideSider = uiState((state) => state.setHideSider);
    const hideSider = uiState((state) => state.hideSider);
    const alwaysOnTop = uiState((state) => state.chatPageAlwaysOnTop);
    const setAlwaysOnTop = uiState((state) => state.setChatPageAlwaysOnTop);
    const setCurrentTool = uiState((state) => state.setCurrentTool);
    const currentTool = uiState((state) => state.currentTool);
    const setShowPromptEditor = uiState((state) => state.setShowPromptEditor);
    const showPromptEditor = uiState((state) => state.showPromptEditor);
    const transPromptEditor = uiState((state) => state.transPromptEditor);
    const setTransPromptEditor = uiState((state) => state.setTransPromptEditor);
    const setPrompt = uiState((state) => state.setPrompt);
    const conf = globalConfig((state) => state.config);
    const isMac = uiState((state) => state.isMac);
    return (
        <div className="titlebar absolute flex flex-row top-0 left-0 h-10 bg-transparent w-full items-center justify-between">
            <div className="inline-flex flex-row gap-4 items-center">
                <div className={`${isMac ? "w-20" : "w-10"} h-full bg-transparent`} />
                <Button
                    onDoubleClick={doubleClickIgnore}
                    size="sm"
                    className="titlebar-icon"
                    onClick={() => {
                        document.startViewTransition(() => {
                            navigate("/setting");
                        })
                    }}
                >
                    <Settings className="size-5" strokeWidth={1} color="gray" />
                </Button>
                <Button onDoubleClick={doubleClickIgnore} size="sm" className="titlebar-icon" onClick={() => setHideSider(!hideSider)}>
                    <Sidebar className="size-5" strokeWidth={1} color="gray" />
                </Button>
                <Button
                    onDoubleClick={doubleClickIgnore}
                    size="sm"
                    className="titlebar-icon"
                    onClick={() => {
                        (async () => {
                            newSession();
                            if (currentTool.includes("function")) {
                                stopMcpServers();
                            }
                            setCurrentTool([]);
                            setPrompt(conf?.systemInstruction || t("defaultSystemPrompt"))
                        })();
                    }}
                >
                    <SquarePen className="size-5" strokeWidth={1} color="gray" />
                </Button>
                {!isMac && <div className="w-5 h-full bg-transparent" />}
                <ChatModelsMenu />
                <Button
                    onDoubleClick={doubleClickIgnore}
                    size={"sm"}
                    className="titlebar-icon"
                    onClick={() => {
                        setShowPromptEditor(!showPromptEditor);
                        setTimeout(() => {
                            setTransPromptEditor(!transPromptEditor);
                        }, 300);
                    }}
                >
                    <Siren className="size-5 text-blue-600/80" strokeWidth={1} />
                </Button>
            </div>
            <div className="inline-flex flex-row items-center justify-end py-1 px-2">
                <Toggle size={"sm"} className="toggle-icon" pressed={alwaysOnTop} onPressedChange={() => {
                    (async () => {
                        const r = await (window.api as any).chatWindowAlwaysOnTop(!alwaysOnTop);
                        setAlwaysOnTop(r);
                    })();
                }}>
                    <Pin className="size-5" strokeWidth={1} color="gray" />
                </Toggle>
                {!isMac && <TrafficLight />}
            </div>
        </div>
    )
}
