import { Button } from "@renderer/components/ui/button";
import { Textarea } from "@renderer/components/ui/textarea";
import { sendMessage, useTool } from "@renderer/lib/ai/gemini";
import { SquareCode, Server, Send, Binoculars, Plus, Loader2Icon, Newspaper, Scissors } from "lucide-react";
import { forwardRef, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useSubmitHandler } from "@renderer/lib/hooks/shouldSubmit";
import { uiState } from "@renderer/lib/state/uistate";
import { getFilePath, getMimeType, openFile } from "@renderer/lib/util/files";
import AttachmentBar from "./attachmentBar";
import YoutubeIcon from "@renderer/assets/youtube.svg";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { mcpServersState } from "@renderer/lib/state/mcpState";
import { listMcpTools, startMcpServer, startMcpServers, stopMcpServer, stopMcpServers } from "@renderer/lib/util/mcpIpc";
import toast from "react-hot-toast";
import { editMcpServer, getAllMcpServers } from "@renderer/lib/data/db";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "../ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { isYoutubeURI, screenShotCallback, startScrenShot } from "@renderer/lib/util/misc";
import { useTranslation } from "react-i18next";
import { checkToolAvialable } from "@renderer/lib/util/model";
import { GeminiToolType } from "@shared/types/session";
import { FileInfo } from "@shared/types/message";
import { globalConfig } from "@renderer/lib/state/confState";
import { EnumMessageSendKey } from "@renderer/lib/data/config";

export default function SendBox() {
    // const [messageText, setMessageText] = useState("");
    const messageText = uiState(state => state.messageText);
    const setMessageText = uiState(state => state.setMessageText);
    const messageCancel = uiState(state => state.messageCancel);
    const { isEnterKeyDown } = useSubmitHandler();
    const currentTool = uiState(state => state.currentTool);
    const setCurrentTool = uiState(state => state.setCurrentTool);
    const currentSessionID = uiState(state => state.currentSessionID);
    const [uploadFiles, setUploadFiles] = useState<undefined | FileInfo[]>(undefined);
    const currentModel = uiState(state => state.currentModel);
    const ref = useRef<any>(null);
    const { t } = useTranslation();
    const gconf = globalConfig(state => state.config);
    const sendMessageAction = async () => {
        (async () => {
            sendMessage(messageText, uploadFiles);
        })();
        await (async () => {
            setUploadFiles(undefined);
            setMessageText("");
        })();
    };
    useEffect(() => {
        const callback = (path: string) => {
            setUploadFiles(prev => {
                if (prev) {
                    if (prev.filter(f => f.path === path).length > 0) {
                        return prev
                    }
                    return [...prev, {
                        path: path,
                        fileType: getMimeType(path),
                    }];
                } else {
                    return [{
                        path: path,
                        fileType: getMimeType(path),
                    }];
                }
            })
        }
        screenShotCallback(callback);
    }, [])
    return (
        <div className="w-full bottom-0 bg-white pt-0 pb-1 px-1.5">
            <div
                className="flex flex-col w-full rounded-md shadow-xs border border-neutral-600/15 bg-neutral-200/20"
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                        for (const f of files) {
                            (async () => {
                                const path = await getFilePath(f as any);
                                // console.log("drop file name:", f.name, "data:", await f.arrayBuffer(), "path", await window.api.filePath(f as any));
                                // const d = await f.arrayBuffer();
                                // console.log(d.byteLength);
                                setUploadFiles(prev => {
                                    if (prev) {
                                        return [...prev, {
                                            path: path,
                                            fileType: getMimeType(path),
                                        }];
                                    } else {
                                        return [{
                                            path: path,
                                            fileType: getMimeType(path),
                                        }];
                                    }
                                })
                            })();
                        }
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <div className="flex flex-row w-full p-0.5 bg-transparent items-center justify-between">
                    <div className="inline-flex items-center my-0 py-0 gap-0.5">
                        <Button
                            className="toolbar-btn bg-transparent"
                            onClick={() => {
                                (async () => {
                                    const files = await openFile();
                                    if (!files || files.length === 0) {
                                        return;
                                    }
                                    setUploadFiles((prev) => {
                                        let fileInfos: FileInfo[] = [];
                                        files.map((f) => {
                                            fileInfos = [...fileInfos, {
                                                path: f,
                                                fileType: getMimeType(f),
                                            }]
                                        })
                                        if (prev) {
                                            return [...prev, ...fileInfos];
                                        } else {
                                            return [...fileInfos];
                                        }
                                    })
                                })();
                            }}
                        >
                            {/* <Paperclip strokeWidth={1} /> */}
                            <Plus strokeWidth={1} />
                        </Button>
                        <Button
                            className="toolbar-btn bg-transparent"
                            onClick={() => {
                                if (ref && ref.current) {
                                    ref.current.open();
                                }
                            }}
                        >
                            <img src={YoutubeIcon} className="text-red-500" alt="" />
                        </Button>
                        <Button
                            className={`toolbar-btn bg-transparent`}
                            onClick={() => {
                                startScrenShot();
                            }}
                        >
                            <Scissors strokeWidth={1} />
                        </Button>
                        <Button
                            className={`toolbar-btn ${currentTool.includes("search") ? "bg-neutral-400/30" : "bg-transparent"}`}
                            disabled={!checkToolAvialable("search", currentTool, currentModel)}
                            onClick={() => {
                                const newTools: GeminiToolType[] = currentTool.includes("search") ? [...currentTool.filter(t => t !== "search")] : [...currentTool, "search"];
                                useTool(newTools);
                                setCurrentTool(newTools);
                            }}
                        >
                            <Binoculars strokeWidth={1} />
                        </Button>
                        <Button
                            className={`toolbar-btn ${currentTool.includes("urlContext") ? "bg-neutral-400/30" : "bg-transparent"}`}
                            disabled={!checkToolAvialable("urlContext", currentTool, currentModel)}
                            onClick={() => {
                                const newTools: GeminiToolType[] = currentTool.includes("urlContext") ? [...currentTool.filter(t => t !== "urlContext")] : [...currentTool, "urlContext"];
                                useTool(newTools);
                                setCurrentTool(newTools);
                            }}
                        >
                            <Newspaper strokeWidth={1} />
                        </Button>
                        <Button
                            className={`toolbar-btn ${currentTool.includes("codeExec") ? "bg-neutral-400/30" : "bg-transparent"}`}
                            disabled={!checkToolAvialable("codeExec", currentTool, currentModel)}
                            onClick={() => {
                                const newTools: GeminiToolType[] = currentTool.includes("codeExec") ? [...currentTool.filter(t => t !== "codeExec")] : [...currentTool, "codeExec"];
                                useTool(newTools);
                                setCurrentTool(newTools);
                            }}
                        >
                            <SquareCode strokeWidth={1} />
                        </Button>
                        <FunctionToolMenu />
                    </div>
                    <div className="inline-flex items-center justify-end my-0">
                        <Button
                            className=" rounded-xs bg-blue-600/80 hover:bg-blue-700 w-12 h-5 px-0.5 gap-0.5 text-white text-xs"
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
                                t("send") : t("stop")}
                            {messageCancel.get(currentSessionID) === undefined ?
                                <Send /> :
                                <Loader2Icon className="animate-spin" />}

                        </Button>
                    </div>
                </div>
                <Textarea
                    className="w-full min-h-5 max-h-24 text-xs resize-none border-none shadow-none outline-0 focus-visible:border-none focus-visible:outline-0 focus-visible:shadow-none focus-visible:ring-0 py-1 px-1.5"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                        if (isEnterKeyDown(e)) {

                            if (messageText.length === 0) {
                                return;
                            }
                            switch (gconf!.sendKey) {
                                case EnumMessageSendKey.Enter:
                                    sendMessageAction();
                                    e.preventDefault();
                                    break;
                                case EnumMessageSendKey.CtrlEnter:
                                    if (e.ctrlKey) {
                                        sendMessageAction();
                                        e.preventDefault();
                                    }
                                    break;
                                case EnumMessageSendKey.AltEnter:
                                    if (e.altKey) {
                                        sendMessageAction();
                                        e.preventDefault();
                                    }
                                    break;
                            }
                        }
                    }}
                />
                {uploadFiles && <AttachmentBar files={uploadFiles} delItem={(item: string) => {
                    setUploadFiles((prev) => {
                        const newItems = prev?.filter(f => f.path !== item);
                        return newItems ? newItems.length > 0 ? newItems : undefined : undefined;
                    })
                }} />}
            </div>
            <YoutubeURIUploader
                ref={ref}
                addURL={(info: FileInfo) => {
                    setUploadFiles(prev => {
                        return prev ? [...prev, info] : [info];
                    })
                }}
            />
        </div>
    )
}

const FunctionToolMenu = () => {
    const { t } = useTranslation();
    const currentTool = uiState((state) => state.currentTool);
    const mcpServers = mcpServersState((state) => state.mcpServers);
    const setMcpServers = mcpServersState((state) => state.setMcpServers);
    const setCurrentTool = uiState((state) => state.setCurrentTool);
    const currentModel = uiState((state) => state.currentModel);
    return (
        <Popover>
            <PopoverTrigger
                disabled={!checkToolAvialable("function", currentTool, currentModel)}
                className={` ${!checkToolAvialable("function", currentTool, currentModel) ? "hover:bg-transparent text-black/50" : "hover:bg-gray-200 text-black/80"} inline-flex flex-row justify-center items-center p-0 rounded-sm shadow-none  size-5 ${currentTool.includes("function") ? "bg-neutral-400/30" : "bg-transparent"}`}
            >
                <Server strokeWidth={1} className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent side="top" className="w-40">
                <div className="flex flex-col gap-y-2">
                    {mcpServers.length > 0 ? <div className="flex flex-row justify-between gap-2">
                        <span className="font-semibold text-xs select-none cursor-default">{t("enableMcp")}</span>
                        <Switch
                            className="focus-visible:ring-0" checked={currentTool.includes("function")}
                            onCheckedChange={() => {
                                const enabled = currentTool.includes("function");
                                const p = new Promise(async (resolve, reject) => {
                                    try {
                                        // enabled ? await stopMcpServers() : await startMcpServers(mcpServers);
                                        if (enabled) {
                                            await stopMcpServers();
                                        } else {
                                            const servers = mcpServers.filter((s) => s.enabledDefault);
                                            if (servers.length > 0) {
                                                await startMcpServers(servers);
                                            } else {
                                                throw new Error("no found enabled mcp server");
                                            }
                                        }
                                        const newTools: GeminiToolType[] = currentTool.includes("function") ? [...currentTool.filter(t => t !== "function")] : [...currentTool, "function"];
                                        setCurrentTool(newTools);
                                        let functions: undefined | any = undefined;

                                        functions = await listMcpTools();
                                        useTool(newTools, functions);

                                        resolve(true);
                                    } catch (e) {
                                        reject(e);
                                    }
                                });
                                toast.promise(p, {
                                    loading: !enabled ? t("enableMcp") : t("disableMcp"),
                                    success: !enabled ? t("enabledMcp") : t("disabledMcp"),
                                    error: (e) => t("errorMcp", { error: e }),
                                })
                            }}
                        />
                    </div> : <div className="flex flex-row justify-center items-center gap-2">
                        <span className="font-semibold text-xs select-none cursor-default">{t("noMcpServer")}</span>
                    </div>}
                    {mcpServers.length > 0 && mcpServers.map((server) => {
                        return (
                            <div className="flex flex-row justify-between gap-2" key={server.uuid}>
                                <span className="font-semibold text-xs select-none cursor-default">{server.name}</span>
                                <Switch
                                    className="focus-visible:ring-0"
                                    // disabled={!(currentTool === "function")}
                                    checked={server.enabledDefault}
                                    onCheckedChange={async () => {
                                        if (server.enabledDefault) {
                                            if (currentTool.includes("function")) {
                                                await stopMcpServer(server);
                                            }

                                            await editMcpServer({ ...server, enabledDefault: false });
                                        } else {
                                            if (currentTool.includes("function")) {

                                                const r = await startMcpServer(server);
                                                await editMcpServer({ ...server, enabledDefault: r });
                                            } else {
                                                await editMcpServer({ ...server, enabledDefault: true });
                                            }
                                        }
                                        const functions = await listMcpTools();
                                        if (currentTool.includes("function")) {
                                            if (functions.length > 0) {
                                                useTool(currentTool, functions);
                                            } else {
                                                useTool(currentTool);
                                                setCurrentTool([...currentTool.filter(t => t !== "function")]);
                                            }
                                        }
                                        const servers = await getAllMcpServers();
                                        setMcpServers(servers);

                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}


const YoutubeURIUploader = forwardRef(({ addURL }: { addURL: (info: FileInfo) => void }, ref: Ref<any>) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [startTime, setStartTime] = useState<number | undefined>(undefined);
    const [stopTime, setStopTime] = useState<number | undefined>(undefined);
    const [fps, setFps] = useState<number | undefined>(undefined);

    useImperativeHandle(ref, () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
    }));
    const [url, setUrl] = useState("");
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="py-1.5 px-0.5" showCloseButton={false}>
                <DialogTitle>
                    <div className="flex flex-row justify-center text-sm font-semibold select-none cursor-default prose h-4 items-center">
                        <p>{t("addYoutubeUrl")}</p>
                    </div>
                </DialogTitle>
                <DialogDescription className="hidden">add youtube url</DialogDescription>
                <div className="w-full flex flex-col justify-center items-start px-2 gap-x-1.5 gap-y-2">
                    <Label className="font-semibold text-xs">{t("youtube")}</Label>
                    <Input
                        className="w-full focus-visible:outline-none focus-visible:ring-0 rounded-sm text-xs h-6 px-1"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                    />
                    <div className="w-full grid grid-cols-2 grid-rows-2 gap-2">
                        <Label className="font-semibold text-xs">{t("ytstartTime")}</Label>
                        <Label className="font-semibold text-xs">{t("ytendTime")}</Label>
                        <Input
                            className="w-full focus-visible:outline-none focus-visible:ring-0 rounded-sm text-xs h-6 px-1"
                            value={startTime !== undefined ? startTime : ""}
                            onChange={(e) => setStartTime(parseInt(e.target.value) || undefined)}
                        />
                        <Input
                            className="w-full focus-visible:outline-none focus-visible:ring-0 rounded-sm text-xs h-6 px-1"
                            value={stopTime !== undefined ? stopTime : ""}
                            onChange={(e) => setStopTime(parseInt(e.target.value) || undefined)}
                        />
                    </div>
                    <Label className="font-semibold text-xs">{t("ytfps")}</Label>
                    <Input
                        className="w-full focus-visible:outline-none focus-visible:ring-0 rounded-sm text-xs h-6 px-1"
                        value={fps !== undefined ? fps : ""}
                        onChange={e => setFps(parseInt(e.target.value) || undefined)}
                        type="number"
                    />
                </div>
                <DialogFooter>
                    <div className="flex flex-row justify-end items-center w-full px-2 gap-1.5">
                        <Button
                            variant={"default"}
                            onClick={() => {
                                setOpen(false);
                                addURL({
                                    path: url,
                                    fileType: "",
                                    youtube: url,
                                    ytStart: startTime,
                                    ytStop: stopTime,
                                    ytFps: fps,

                                });
                                setUrl("");
                                setFps(undefined);
                                setStartTime(undefined);
                                setStopTime(undefined);
                            }}
                            size={"sm"}
                            className="text-xs py-1 px-2 h-6"
                            disabled={!isYoutubeURI(url)}
                        >
                            {t("add")}
                        </Button>
                        <Button variant={"secondary"} onClick={() => setOpen(false)} size={"sm"} className="text-xs py-1 px-2 h-6">{t("close")}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
