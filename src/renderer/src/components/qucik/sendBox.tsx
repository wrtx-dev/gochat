import { Binoculars, Loader2Icon, Newspaper, SendHorizonal, Trash2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useSubmitHandler } from "@renderer/lib/hooks/shouldSubmit";
import { uiState } from "@renderer/lib/state/uistate";
import { newSession, sendMessage, useTool } from "@renderer/lib/ai/gemini";
import { resetWindowShadow, resetWindowSize, setMouseIgnore } from "@renderer/lib/util/quick";
import { quickState } from "@renderer/lib/state/quickWinState";
import { useEffect, useLayoutEffect, useRef } from "react";
import { GeminiToolType } from "@shared/types/session";
import { checkToolAvialable } from "@renderer/lib/util/model";
import { EnumMessageSendKey } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";

export default function QuickSendBox() {
    const { isEnterKeyDown } = useSubmitHandler();
    const setMessageText = uiState(state => state.setMessageText);
    const messageText = uiState(state => state.messageText);
    const messageCancel = uiState(state => state.messageCancel);
    const currentSessionID = uiState(state => state.currentSessionID);
    const mouseForward = quickState(state => state.mouseForward);
    const setMouseForward = quickState(state => state.setMouseForward);
    const currentTool = uiState(state => state.currentTool);
    const currentModel = uiState(state => state.currentModel);
    const setCurrentTool = uiState(state => state.setCurrentTool);
    const gconf = globalConfig(state => state.config);
    const sendMessageAction = async () => {
        (async () => {
            sendMessage(messageText, undefined);
        })();
        await (async () => {
            setMessageText("");
        })();
    }
    useEffect(() => {
        setTimeout(() => {
            resetWindowShadow();
        }, 50);
    }, [currentSessionID]);
    const quickInputRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        if (currentSessionID.length === 0) {
            if (quickInputRef && quickInputRef.current) {
                const size = { w: quickInputRef.current.clientWidth, h: quickInputRef.current.clientHeight + 10 };
                resetWindowSize(size);
                quickInputRef.current.focus();
            }
        } else {
            if (quickInputRef && quickInputRef.current) {
                resetWindowSize({ w: 320, h: 500 });
            }
        }
    }, [currentSessionID]);
    return (
        <div
            className={`w-full h-auto flex flex-col bg-neutral-100 rounded-b-md border border-neutral-200 ${currentSessionID.length === 0 && "rounded-t-md"}`}
            ref={quickInputRef}
            onMouseEnter={!mouseForward ? undefined : (e) => {
                e.preventDefault();
                e.stopPropagation();

                setMouseIgnore(false);
                setMouseForward(!mouseForward);

            }}

        >
            <div className="w-full inline-flex flex-row bg-transparent p-y-0.5 rounded-t-md items-center px-1">
                <div className="flex flex-row h-full justify-start items-center gap-1 py-0.5">
                    <Button
                        size={"icon"}
                        variant={"destructive"}
                        className="size-4 rounded-xs hover:bg-gray-200 bg-neutral-100 text-black shadow-none"
                        onClick={() => {
                            setCurrentTool([]);
                            newSession();
                        }}
                    >
                        <Trash2 strokeWidth={1} className="size-3.5" />
                    </Button>
                    <Button
                        className={`rounded-xs shadow-none hover:bg-gray-200 size-4 text-black/80 ${currentTool.includes("search") ? "bg-neutral-400/30" : "bg-transparent"}`}
                        size={"icon"}
                        variant={"destructive"}
                        disabled={!checkToolAvialable("search", currentTool, currentModel)}
                        onClick={() => {
                            const newTools: GeminiToolType[] = currentTool.includes("search") ? [...currentTool.filter(t => t !== "search")] : [...currentTool, "search"];
                            useTool(newTools);
                            setCurrentTool(newTools);
                        }}
                    >
                        <Binoculars strokeWidth={1} className="size-3.5" />
                    </Button>
                    <Button
                        className={`rounded-xs shadow-none hover:bg-gray-200 size-4 text-black/80 ${currentTool.includes("urlContext") ? "bg-neutral-400/30" : "bg-transparent"}`}
                        disabled={!checkToolAvialable("urlContext", currentTool, currentModel)}
                        size={"icon"}
                        variant={"destructive"}
                        onClick={() => {
                            const newTools: GeminiToolType[] = currentTool.includes("urlContext") ? [...currentTool.filter(t => t !== "urlContext")] : [...currentTool, "urlContext"];
                            useTool(newTools);
                            setCurrentTool(newTools);
                        }}
                    >
                        <Newspaper strokeWidth={1} className="size-3.5" />
                    </Button>
                </div>
                <div
                    className={`flex-1 h-full ${currentSessionID.length === 0 && 'appdrag'}`}
                />
                <div className="flex flex-row h-full justify-end items-center bg-transparent">
                    <Button
                        size={"icon"}
                        variant={"destructive"}
                        className="h-4 w-8 rounded-xs bg-blue-500 hover:bg-blue-600"
                        disabled={messageText.length === 0 && messageCancel.get(currentSessionID) === undefined}
                        onClick={() => {
                            if (messageCancel.get(currentSessionID) === undefined) {
                                sendMessageAction();
                            } else {
                                const cancel = messageCancel.get(currentSessionID);
                                if (cancel) {
                                    cancel();
                                }
                            }
                        }}
                    >
                        {messageCancel.get(currentSessionID) === undefined ?
                            <SendHorizonal /> :
                            <Loader2Icon className="animate-spin" />}
                    </Button>
                </div>
            </div>
            <Textarea
                className={`w-full text-xs resize-none min-h-5 ${currentSessionID.length === 0 ? "max-h-6" : "max-h-48"} focus-visible:outline-0 focus-visible:ring-0 px-1 py-1 border-none focus-visible:border-none`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                    if (isEnterKeyDown(e)) {
                        e.preventDefault();
                        if (messageText.length === 0) {
                            return;
                        }
                        switch (gconf!.sendKey) {
                            case EnumMessageSendKey.Enter:
                                sendMessageAction();
                                break;
                            case EnumMessageSendKey.CtrlEnter:
                                if (e.ctrlKey) {
                                    sendMessageAction();
                                } else {
                                    setMessageText(`${messageText}\n`);
                                }
                                break;
                            case EnumMessageSendKey.AltEnter:
                                if (e.altKey) {
                                    sendMessageAction();
                                } else {
                                    setMessageText(`${messageText}\n`);
                                }
                                break;
                            default:
                                setMessageText(`${messageText}\n`);
                                break;
                        }
                    }
                }}
            />
        </div>
    )
}