import { session } from "@shared/types/session";
import { uiState } from "@renderer/lib/state/uistate";
import { newSession, registerFleshSessionList, updateSessionTitle } from "@renderer/lib/ai/gemini";
import { useEffect, useState } from "react";
import { deleteSession, getAllSessions } from "@renderer/lib/data/db";
import SessionItemContextMenu, { SessionProps } from "@renderer/components/sider/sessionContextMenu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useTranslation } from "react-i18next";
import { formatTimestamp } from "@renderer/lib/util/misc";



const SessionListView = ({ hideSider, onChangeSession, sessions, currentSession, filter, contextMenuItemHandler }: { hideSider: boolean, onChangeSession: (uuid: string) => void, sessions: session[], currentSession: string, filter: string, contextMenuItemHandler?: (action: "del" | "edit", s: session) => void }) => {
    let tag = "";
    const [contextMenu, setContextMenu] = useState<SessionProps | null>(null);
    const handleContextMenu = (item: session) => {
        return (event: React.MouseEvent<HTMLLIElement>) => {
            event.preventDefault(); // 阻止默认的浏览器右键菜单

            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                session: item,
                onClose: () => setContextMenu(null),
                contextMenuItemHandler: contextMenuItemHandler
            });
        };
    }
    const { t } = useTranslation();
    return (
        <>
            {sessions.map((session) => {
                if (filter !== "") {
                    const sessionName = session.sessionName === "unname" ? t("unNamedSession") : session.sessionName;
                    if (!sessionName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())) {
                        return null;
                    }
                }
                const timeUnit = formatTimestamp(session.updateTime);
                const flag = `${timeUnit.tidx > 0 ? timeUnit.tidx : ""}${t(timeUnit.unit)}` === tag;
                if (!flag) {
                    tag = `${timeUnit.tidx > 0 ? timeUnit.tidx : ""}${t(timeUnit.unit)}`;
                }

                return (
                    <div key={session.uuid}>
                        {!flag && <li className="ps-1 pb-1 text-xs text-neutral-500/75 opacity-60 tracking-wide select-none pointer-events-none">{`${timeUnit.tidx > 0 ? timeUnit.tidx : ""}${t(timeUnit.unit)}`}</li>}
                        <li
                            className={`ps-3 pe-1 text-gray-600 ${session.uuid === currentSession ? "bg-neutral-200" : "bg-transparent"} ${hideSider ? "hidden" : ""} text-sm h-8 rounded-sm justify-between items-center flex`}
                            onClick={() => currentSession !== session.uuid && onChangeSession(session.uuid)}
                            onContextMenu={handleContextMenu(session)}
                            title={session.sessionName === "unname" ? t("unNamedSession") : session.sessionName}
                        // title={session.sessionName}
                        >
                            <div className={`bg-transparent ${session.uuid === currentSession ? "cursor-default" : "cursor-pointer"} w-[98%] ${hideSider ? "hidden" : ""}  overflow-hidden text-ellipsis`}>
                                <span className="text-nowrap select-none">
                                    {session.sessionName === "unname" ? t("unNamedSession") : session.sessionName}
                                    {/* {session.sessionName} */}
                                </span>
                            </div>
                        </li>
                    </div>
                )
            })}
            {contextMenu && <SessionItemContextMenu {...contextMenu}
                onClose={() => {
                    setContextMenu(null);
                }}
            />}
        </>
    )
}


export default function SessionItemList({ onChangeSession }: { onChangeSession: (uuid: string) => void }) {
    const hideSider = uiState((state) => state.hideSider);
    const currentSessionID = uiState((state) => state.currentSessionID);
    const currentSession = uiState((state) => state.currentSession);
    const setCurrentSession = uiState((state) => state.setCurrentSession);
    const sessions = uiState((state) => state.sessions);
    const setSessions = uiState((state) => state.setSessions);
    const filter = uiState((state) => state.sessionFilter);
    const [selectedSession, setSelectedSession] = useState<session | null>(null);
    const [openDelDialog, setOpenDelDialog] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [sessionName, setSessionName] = useState("");
    useEffect(() => {
        registerFleshSessionList(() => {
            (async () => {
                const sessions = await getAllSessions();
                setSessions(sessions);
            })();
        })
    }, []);
    return (
        <>
            <div className="flex flex-col flex-1 w-full h-full overflow-y-auto overflow-x-hidden select-none">
                <ul className={`flex flex-col text-[14px] gap-1 bg-transparent w-52 px-2  ${hideSider ? "hidden" : ""}`}>
                    <SessionListView
                        hideSider={hideSider}
                        onChangeSession={onChangeSession}
                        sessions={sessions}
                        currentSession={currentSessionID}
                        filter={filter}
                        key="sessionList"
                        contextMenuItemHandler={(action, session) => {
                            switch (action) {
                                case "del":
                                    if (session) {
                                        setSelectedSession(session);
                                        setOpenDelDialog(true);
                                    }
                                    break;
                                case "edit":
                                    if (session) {
                                        setSelectedSession(session);
                                        setSessionName(session.sessionName);
                                        setShowRename(true);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }}
                    />
                </ul>
            </div>
            <Dialog open={selectedSession !== null && openDelDialog} onOpenChange={setOpenDelDialog}>
                <DialogContent className="session-dialog">
                    <DialogHeader className="h-6">
                        <DialogTitle asChild>
                            <div className="w-full flex flex-row p-1 items-center justify-center select-none cursor-default">
                                <span className="text-sm text-neutral-600 font-semibold">deleteSession</span>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="hidden">cantResume</DialogDescription>
                    </DialogHeader>
                    <div className="w-full flex flex-row items-center justify-center">
                        <span className="text-sm font-bold text-red-400">session {selectedSession?.sessionName === "" ? "unNamedSession" : selectedSession?.sessionName} comfirmDeleteSession</span>
                    </div>
                    <DialogFooter>
                        <div className="flex flex-row-reverse w-full gap-2">
                            <Button className="w-12 h-6 text-xs" variant={"secondary"} onClick={() => setOpenDelDialog(false)}>取消</Button>
                            <Button className="w-12 h-6 text-xs"
                                variant={"destructive"}
                                onClick={() => {
                                    if (selectedSession) {
                                        (async () => {
                                            await deleteSession(selectedSession.uuid);
                                            if (selectedSession.uuid === currentSessionID) {
                                                newSession();
                                            }
                                            const ss = await getAllSessions();
                                            setSessions(ss);
                                        })();
                                    }
                                    setSelectedSession(null);;
                                    setOpenDelDialog(false);
                                }}
                            >删除</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={selectedSession !== null && showRename} onOpenChange={setShowRename}>
                <DialogContent className="session-dialog" >
                    <DialogTitle>
                        <div className="w-full flex flex-row p-1 items-center justify-center select-none cursor-default">
                            <span className="text-sm text-neutral-600 font-semibold">rename {selectedSession?.sessionName === "" ? "unNamedSession" : selectedSession?.sessionName}</span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="hidden">重命名会话</DialogDescription>
                    <div className="grid grid-cols-7 w-full">
                        <Label className="col-span-2" htmlFor="renameInput">新会话名</Label>
                        <Input
                            className="col-span-5 focus-within:outline-none focus-within:ring-0 focus-visible:ring-0 ring-0"
                            id="renameInput"
                            placeholder={"请输入新会话名称"}
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <div className="flex flex-row-reverse w-full gap-2">
                            <Button
                                className="w-12 h-6 text-xs"
                                variant={"default"}
                                onClick={() => setShowRename(false)}
                            >
                                取消
                            </Button>
                            <Button
                                className="w-12 h-6 text-xs bg-green-500/90 hover:bg-green-600/90"
                                variant={"destructive"}
                                onClick={() => {
                                    if (selectedSession) {
                                        updateSessionTitle(selectedSession.uuid, sessionName);
                                        if (currentSession && currentSession.uuid === selectedSession.uuid) {
                                            setCurrentSession({ ...selectedSession, sessionName: sessionName });
                                        }
                                        setShowRename(false);
                                    }
                                    setShowRename(false);
                                }}
                                disabled={sessionName === "" || sessionName === selectedSession?.sessionName}
                            >
                                确认
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
        </>
    )
}