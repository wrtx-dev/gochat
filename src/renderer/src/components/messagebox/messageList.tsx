import { Message } from "@shared/types/message"
import { useState, ComponentProps, memo, useEffect, useRef, useCallback, useLayoutEffect } from "react"
import MarkdownMessage from "@renderer/components/markdown/markdownMessage";
import { Alert, AlertDescription, AlertTitle } from "@renderer/components/ui/alert";
import { AlertCircle, FileAudio, FileImage, FileQuestion, FileText, FileVideo, Copy, SquareDashedMousePointer, FileDown } from "lucide-react";
import { loadSession, registerAddMessage, registerClearMessages, registerFinishedLoadSession, registerLoadMessageList } from "@renderer/lib/ai/gemini";
import { getFileIconType } from "@renderer/lib/util/files";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { uiState } from "@renderer/lib/state/uistate";
import { useTranslation } from "react-i18next";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "../ui/context-menu";
import { saveFileDialog } from "@renderer/lib/util/misc";
import { SearchMatch, searchState } from "@renderer/lib/state/searchState";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import SearchWrap from "./searchWrap";

export default function MessageList() {
    const [messages, setMessages] = useState<Message[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentSessionID = uiState((state) => state.currentSessionID);
    const messageCanncel = uiState(state => state.messageCancel);
    const storeSessionID = uiState(state => state.storeSessionID);
    const setStoreSessionID = uiState(state => state.setStoreSessionID);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        registerAddMessage((msg: Message, flag: boolean, supports?: Map<string, string>) => {
            if (msg.sessionID !== currentSessionID) {
                return;
            }
            if (flag) {
                if (msg.id === "") {
                    msg.id = crypto.randomUUID();
                }
                let msgText = msg.message;
                if (supports && supports.size > 0) {
                    supports.forEach((v, k) => {
                        msgText = msgText.replace(k, v);
                    });
                }
                setMessages(prev => [...prev, { ...msg, message: msgText }]);
            } else {
                setMessages((prev) => {
                    let lastMsg = prev[prev.length - 1];
                    let newMsg: Message = { ...lastMsg, finished: msg.finished };
                    if (msg.message.length > 0) {
                        newMsg.message += msg.message;
                        if (supports && supports.size > 0) {
                            supports.forEach((v, k) => {
                                newMsg.message = newMsg.message.replace(k, v);
                            });
                        }
                    }
                    if (msg.thinking && msg.thinking.length > 0) {
                        if (newMsg.thinking) {
                            newMsg.thinking += msg.thinking;
                        } else {
                            newMsg.thinking = msg.thinking;
                        }
                    }
                    if (msg.funcCalls.length > 0 && msg.hasFuncCall) {
                        newMsg.hasFuncCall = msg.hasFuncCall;
                        newMsg.funcCalls = [...newMsg.funcCalls, ...msg.funcCalls];
                    }
                    if (msg.isError) {
                        newMsg.isError = msg.isError;
                        if (msg.errInfo.length > 0 && (!newMsg.errInfo || newMsg.errInfo.length === 0)) {
                            newMsg.errInfo = msg.errInfo;
                        }
                    }
                    if (msg.renderedContent) {
                        newMsg.renderedContent = msg.renderedContent;
                    }
                    return [...prev.slice(0, -1), newMsg];
                });
            }
        });
        registerClearMessages(() => {
            setMessages([]);
        });
        registerLoadMessageList((messages: Message[], id: string) => {
            if (id !== currentSessionID) {
                return;
            }
            setMessages(messages);
        });
    }, [currentSessionID]);
    const storeSessionid = () => {
        setStoreSessionID(currentSessionID);
    }
    useEffect(() => {
        registerFinishedLoadSession(() => {
            setLoaded(true);
        });
        return () => {
            storeSessionid();
        }
    }, []);
    useLayoutEffect(() => {
        if (loaded) {

            requestAnimationFrame(() => {
                if (msgListRef && msgListRef.current) {
                    console.log("request to scroll")
                    msgListRef.current.scrollToIndex({
                        align: "end",
                        index: "LAST",
                    });
                }

            });

            setLoaded(false);
        }
    }, [loaded]);
    useEffect(() => {
        if (storeSessionID && storeSessionID.length > 0) {
            (async () => {
                await loadSession(storeSessionID);
                setStoreSessionID(undefined);
            })();
        }
    }, [storeSessionID]);


    const query = searchState(state => state.query);
    const setSearchRange = searchState(state => state.setSearchRange);
    const ignoreCase = searchState(state => state.ignoreCase);
    const currentIndex = searchState(state => state.currentIndex);
    const searchRange = searchState(state => state.searchRange);
    const searchMatches = useCallback(() => {
        const matches: SearchMatch[] = [];
        if (query) {
            const regexp = new RegExp(query, ignoreCase && /^[a-zA-Z\.\s]+$/.test(query) ? "gi" : "g");

            messages.forEach((msg, idx) => {
                const text = msg.message + (msg.renderedContent || "");
                let match: RegExpExecArray | null;
                let matchIndex = 0;
                while ((match = regexp.exec(text))) {
                    matches.push({
                        listIndex: idx,
                        start: match.index,
                        end: match.index + match[0].length,
                        indexInMessage: matchIndex
                    });
                    matchIndex++;
                }
            });
        }
        return matches.length > 0 ? matches : undefined;
    }, [query, ignoreCase, messages]);

    useEffect(() => {
        if (!query || query.length === 0) {
            return;
        }
        const timer = setTimeout(() => {
            const matches = searchMatches();
            setSearchRange(matches);
        }, 100);
        return () => {
            clearTimeout(timer);
        }
    }, [searchMatches, query]);
    const msgListRef = useRef<VirtuosoHandle>(null);

    useEffect(() => {
        if (msgListRef && msgListRef.current && searchRange !== undefined && searchRange.length > 0 && currentIndex > -1) {
            if (currentIndex > 1 && searchRange[currentIndex] && searchRange[currentIndex - 1]) {
                if (Math.abs(searchRange[currentIndex].listIndex - searchRange[currentIndex - 1].listIndex) > 2) {
                    msgListRef.current.scrollToIndex(searchRange[currentIndex].listIndex);
                }
            } else {
                msgListRef.current.scrollToIndex(searchRange[currentIndex].listIndex);
            }
        }
    }, [currentIndex, searchRange])


    const MessageItem = useCallback((index: number, msg: Message) => {
        const idx = searchRange !== undefined && searchRange.length > 0 && currentIndex > -1 && searchRange[currentIndex] !== undefined && searchRange[currentIndex].listIndex === index ? searchRange[currentIndex].indexInMessage : -1;
        return (
            <div
                className={`px-1 w-full`}
            >

                {query && query.length > 0
                    ?
                    <SearchWrap
                        query={query}
                        ignoreCase={ignoreCase}
                        reverse={msg.role === "user"}
                        idx={idx}
                    >
                        {msg.role !== "user" ? <AssistentMessage finished={msg.finished} msg={msg} /> : <UserMessage msg={msg} />}
                    </SearchWrap>
                    :
                    <div className={`inline-flex w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        {msg.role !== "user" ? <AssistentMessage finished={msg.finished} msg={msg} /> : <UserMessage msg={msg} />}
                    </div>
                }

            </div>
        )
    }, [query, ignoreCase, currentIndex]);

    // const followOutput = useCallback((isBottom: boolean) => {
    //     if (!isBottom) {
    //         console.log("followOutput:", messages.length > 0 && messages[messages.length - 1].role === "user")
    //         return messages.length > 2 && messages[messages.length - 1].role === "user";
    //     }
    //     console.log("followOutput2:", false);
    //     return false;

    // }, [messages.length])
    useLayoutEffect(() => {
        if (msgListRef && msgListRef.current && messages && messages.length > 2 && messages[messages.length - 1].role === "user") {
            msgListRef.current.scrollToIndex({
                align: "end",
                index: messages.length - 1,
                behavior: "smooth"
            });
        }
    }, [messages])

    return (
        <div className="flex flex-col w-full h-full overflow-x-hidden overflow-y-auto flex-1 min-h-0 bg-white pb-2" ref={containerRef}>

            <Virtuoso
                ref={msgListRef}
                style={{ height: "100%", width: "100%", scrollbarGutter: "stable" }}
                data={messages}
                overscan={4}
                increaseViewportBy={{ top: 1000, bottom: 1000 }}
                components={{
                    Footer: () => {
                        return (
                            <>
                                {messageCanncel.get(currentSessionID) !== undefined && <WaitAssistantMessage />}
                                <div className={`w-full`} style={{ minHeight: `${(containerRef.current?.offsetHeight ?? 2) / 2}px` }} />
                            </>
                        )
                    }
                }}
                itemContent={MessageItem}
            />
        </div>
    )
}


const AssistentMessage = memo(({ msg, finished, ...props }: { msg: Message, finished: boolean } & ComponentProps<"div">) => {
    const { t } = useTranslation();
    const msgRef = useRef<HTMLDivElement>(null);
    const setMessageText = uiState(state => state.setMessageText);
    const messageText = uiState(state => state.messageText);
    const getSelectedTextOrAllText = () => {
        const selection = window.getSelection();
        if (selection) {
            if (selection.rangeCount > 0 && msgRef.current) {
                if (msgRef.current.contains(selection.getRangeAt(0).commonAncestorContainer) && selection.toString().length > 0) {
                    return selection.toString();
                }
            }
        }
        return msg.message;
    }
    return (
        <div className="flex flex-col w-full mt-2 min-h-0.5 px-2 text-gray-600" {...props}>
            {(msg.thinking && msg.message) && <ThoughtBlock thought={msg.thinking} thinking={msg.message.length < 1 && !msg.isError && !msg.finished} />}
            {(msg.message && msg.message.length > 0) &&
                <div className="flex flex-col w-full" ref={msgRef}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <MarkdownMessage content={`${msg.message}${msg.renderedContent || ""}`} disableRawHtml={false} />
                        </ContextMenuTrigger>
                        <ContextMenuContent className="text-xs w-32">
                            <ContextMenuItem
                                className="text-xs"
                                onClick={() => {
                                    const copyText = getSelectedTextOrAllText();

                                    navigator.clipboard.writeText(copyText);


                                }}
                            >
                                {t("copy")}
                                <ContextMenuShortcut>
                                    <Copy strokeWidth={1} />
                                </ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem
                                className="text-xs"
                                onClick={() => {
                                    const quoteText = getSelectedTextOrAllText();
                                    const split = "\n---"
                                    if (messageText.length < 1) {
                                        setMessageText(`${quoteText}\n${split}\n`)
                                    } else {
                                        setMessageText(`${messageText}\n${split}\n${quoteText}\n${split}\n`)
                                    }
                                }}
                            >
                                {t("quote")}
                                <ContextMenuShortcut>
                                    <SquareDashedMousePointer strokeWidth={1} />
                                </ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem
                                className="text-xs"
                                onClick={() => {
                                    saveFileDialog(msg.message);
                                }}
                            >
                                {t("exportMD")}
                                <ContextMenuShortcut>
                                    <FileDown strokeWidth={1} />
                                </ContextMenuShortcut>
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                </div>}
            {msg.isError && <ErrorMessage msg={msg.errInfo} />}
            {msg.hasFuncCall && msg.funcCalls.length > 0 && <div className="w-full md:w-2/3 flex flex-col  rounded-md bg-neutral-200/35 px-2 text-neutral-300">
                <Accordion type="multiple">
                    {msg.funcCalls.map((f) => {
                        return (
                            <AccordionItem value={`${f.id}-${f.name}`} key={`${f.id}-${f.name}-${f.args}`}>
                                <AccordionTrigger
                                    className="inline-flex h-6 flex-row justify-between items-center w-full text-black text-xs font-semibold"
                                >
                                    <div className="inline-flex flex-row justify-start w-full items-center gap-1">
                                        {f.name}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="prose text-neutral-600">
                                        <p>{JSON.stringify(f.args, null, 2)}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>}
        </div>
    )
}, (prev, props) => prev.msg === props.msg && prev.finished === props.finished)

const ThoughtBlock = memo(({ thought, thinking, ...props }: { thought: string, thinking: boolean } & ComponentProps<"div">) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:w-2/3 w-3/4 sm:text-sm text-xs rounded-md bg-neutral-200/35 px-2 text-neutral-300 mb-1" {...props}>
            <Accordion type="single" collapsible={true} >
                <AccordionItem value="think">
                    <AccordionTrigger
                        className="inline-flex sm:h-6 h-4 flex-row justify-between items-center w-full text-black text-xs font-semibold"
                    >
                        <div className="inline-flex flex-row justify-start items-center gap-1 select-none">
                            {t("thinking")}
                            {thinking && <div className="sm:w-4 w-3 sm:h-4 h-3 rounded-full border-2 border-t-blue-500/55 animate-spin" />}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <MarkdownMessage content={thought} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}, (prev, prop) => prev.thought === prop.thought && prev.thinking === prop.thinking);

const UserMessage = memo(({ msg }: { msg: Message }) => {
    const { t } = useTranslation();
    const setMessageText = uiState(state => state.setMessageText);
    const messageText = uiState(state => state.messageText);
    const msgRef = useRef<HTMLDivElement>(null);
    const getSelectedTextOrAllText = () => {
        const selection = window.getSelection();
        if (selection) {
            if (selection.rangeCount > 0 && msgRef.current) {
                if (msgRef.current.contains(selection.getRangeAt(0).commonAncestorContainer) && selection.toString().length > 0) {
                    return selection.toString();
                }
            }
        }
        return msg.message;
    }
    return (
        <div className="inline-block max-w-2/3 break-all overflow-hidden min-h-0.5">
            <div className="flex flex-col mt-2 px-2 max-w-full bg-neutral-200/50 items-center justify-center rounded-sm" ref={msgRef}>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <MarkdownMessage content={msg.message} disableRawHtml={true} />
                    </ContextMenuTrigger>
                    <ContextMenuContent className="text-xs w-32">
                        <ContextMenuItem
                            className="text-xs"
                            onClick={() => {
                                const copyText = getSelectedTextOrAllText();

                                navigator.clipboard.writeText(copyText);


                            }}
                        >
                            {t("copy")}
                            <ContextMenuShortcut>
                                <Copy strokeWidth={1} />
                            </ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                            className="text-xs"
                            onClick={() => {
                                const quoteText = getSelectedTextOrAllText();
                                const split = "\n---"
                                if (messageText.length < 1) {
                                    setMessageText(`${quoteText}\n${split}\n`)
                                } else {
                                    setMessageText(`${messageText}\n${split}\n${quoteText}\n${split}\n`)
                                }
                            }}
                        >
                            {t("quote")}
                            <ContextMenuShortcut>
                                <SquareDashedMousePointer strokeWidth={1} />
                            </ContextMenuShortcut>
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>

                {msg.files.length > 0 && <div className="w-full flex flex-row flex-wrap">
                    {msg.files.map((f) => {
                        const fileType = getFileIconType(f.path);
                        let Icon = FileQuestion;
                        switch (fileType) {
                            case "image":
                                Icon = FileImage;
                                break;
                            case "audio":
                                Icon = FileAudio;
                                break;
                            case "video":
                                Icon = FileVideo;
                                break;
                            case "document":
                                Icon = FileText;
                                break;
                            default:
                                Icon = FileQuestion;
                        }
                        return (
                            <div
                                className="h-7 w-6 p-0.5 bg-neutral-200/50 inline-flex justify-center items-center rounded-sm"
                                key={f.path}
                            >
                                <Icon className="size-4 text-pink-500/85" strokeWidth={1} />
                            </div>
                        )
                    })}
                </div>}
            </div>
        </div>
    )
}, (prev, props) => prev.msg === props.msg)


const ErrorMessage = memo(({ msg, ...props }: { msg: string } & ComponentProps<"div">) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:w-full w-[80%] mt-2 px-2" {...props}>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("requestError")}</AlertTitle>
                <AlertDescription>
                    <div className="w-full overflow-x-hidden break-all">
                        {msg}
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
}, (prev, prop) => prev.msg === prop.msg)

const WaitAssistantMessage = memo(() => {
    return (
        <div className="inline-block ps-4 p-2 ">
            <div className="dot-expand rounded-full bg-black size-0.5" />
        </div>
    )
})
