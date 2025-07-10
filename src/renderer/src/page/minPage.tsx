import QuickMessageBox from "@renderer/components/qucik/messageBox";
import QuickSendBox from "@renderer/components/qucik/sendBox";
import { geminiInit, registerAbortMessage, registerDeleteAbortMessage, registerSetCurrentModel, registerSetCurrentSessionID, updateConf } from "@renderer/lib/ai/gemini";
import { loadConfig } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";
import { quickState } from "@renderer/lib/state/quickWinState";
import { uiState } from "@renderer/lib/state/uistate";
import { autoGetModelDisplayName } from "@renderer/lib/util/model";
import { hideWindow, onConfChanged, onWindowBlur, setMouseIgnore } from "@renderer/lib/util/quick";
import { MessageCancelFn } from "@shared/types/message";
import { useEffect, useState } from "react";

export default function QuickApp() {
    const setCurrentSessionID = uiState((state) => state.setCurrentSessionID);
    const addMessageCancel = uiState(state => state.addMessageCancel);
    const deleteMessageCancel = uiState(state => state.deleteMessageCancel);
    const currentSessionID = uiState(state => state.currentSessionID);
    const mouseForward = quickState(state => state.mouseForward);
    const setCurrentModel = uiState(state => state.setCurrentModel);
    const currentModel = uiState(state => state.currentModel);
    const setMouseForward = quickState(state => state.setMouseForward);
    const setConfig = globalConfig(state => state.setConfig);
    const quickInit = async () => {
        const conf = await loadConfig();
        setConfig(conf);
        setCurrentModel(conf!.defaultModel);
        registerSetCurrentSessionID(setCurrentSessionID);
        registerAbortMessage((key: string, ca: MessageCancelFn) => {
            addMessageCancel(key, ca);
        });
        registerDeleteAbortMessage((key: string) => {
            deleteMessageCancel(key);
        });
        registerSetCurrentModel((m: string) => {
            console.log("set current model:", m);
            setCurrentModel(m);
        })
        geminiInit(conf!, true);

    }
    useEffect(() => {
        quickInit();
    }, []);
    useEffect(() => {
        onConfChanged(() => {
            (async () => {
                console.log("get conf changed event");
                const conf = await loadConfig();
                if (conf) {
                    setConfig(conf);
                    updateConf(conf);
                }
            })();
        });
        onWindowBlur(() => {
            setDragable(false);
        });
    }, []);
    useEffect(() => {
        const escKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                hideWindow();
            }
        }
        document.addEventListener("keydown", escKeyDown);
        return () => {
            document.removeEventListener("keydown", escKeyDown);
        }
    });
    const [modelName, setModelName] = useState("");
    useEffect(() => {
        (async () => {
            const name = await autoGetModelDisplayName(currentModel);
            setModelName(name);
        })();
    }, [currentModel])
    const [dragable, setDragable] = useState(false);
    return (
        <div className="h-screen w-screen overflow-hidden bg-transparent flex flex-col-reverse border-none">
            <QuickSendBox />
            {currentSessionID.length > 0 &&
                <div
                    className="flex-1 bg-white overflow-hidden"
                    onMouseEnter={dragable ? () => setDragable(false) : undefined}
                >
                    <QuickMessageBox />
                </div>}
            {currentSessionID.length > 0 &&
                <div
                    className={`w-full flex flex-row items-center justify-center h-6 bg-white shadow-2xl shadow-neutral-400 rounded-t-md border border-neutral-200/50`}
                    onMouseEnter={() => { setDragable(false) }}
                >
                    <div
                        className={`${dragable && "appdrag"}  w-[98%] bg-white h-4 rounded-md inline-flex flex-row items-center justify-center`}
                        onMouseEnter={(e) => {
                            e.stopPropagation();
                            setTimeout(() => {
                                setDragable(true);
                            })
                        }}
                    >
                        <span className="text-xs">{modelName}</span>
                    </div>
                </div>}
            {currentSessionID.length === 0 &&
                <div
                    className="flex-1 bg-transparent"
                    onMouseEnter={mouseForward ? undefined : (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMouseIgnore(true);
                        setMouseForward(!mouseForward);
                    }}
                />}
        </div>
    )
}