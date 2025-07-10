import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { mcpServersState } from "@renderer/lib/state/mcpState";
import { mcpServerInfo } from "@shared/types/mcp";
import { deleteMcpServer, getAllMcpServers, setMcpServerStatus } from "@renderer/lib/data/db";
import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@renderer/components/ui/hover-card";
import { Info } from "lucide-react";


export default function McpServerTable({ servers, edit }: { servers: mcpServerInfo[], edit: (server: mcpServerInfo) => void }) {
    const [server, setServer] = useState<mcpServerInfo>();
    const [open, setOpen] = useState(false);
    const setServers = mcpServersState((state) => state.setMcpServers);
    const { t } = useTranslation();

    return (
        <>
            <div className="flex flex-wrap flex-row justify-start w-full gap-3 select-none cursor-default">
                {servers.map((server) => {
                    return (
                        <Card className="w-52 h-36 py-1 px-0.5 gap-y-1.5" key={server.uuid}>
                            <CardHeader className="px-1 w-full">
                                <CardTitle className="text-lg w-full truncate">
                                    <div className="inline-flex flex-row justify-start items-center gap-1 px-0.5 max-w-[calc(100%-20px)]">
                                        <span className="truncate">{server.name}</span>
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <span className="inline-flex flex-row items-center justify-center size-4">
                                                    <Info strokeWidth={1} />
                                                </span>
                                            </HoverCardTrigger>
                                            <HoverCardContent side="right">
                                                <span className="text-xs font-extralight select-none cursor-default">
                                                    {server.description}
                                                </span>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </div>
                                </CardTitle>
                                <CardDescription className="flex flex-row gap-x-1 text-xs text-ellipsis whitespace-nowrap overflow-hidden w-full">
                                    <span className="truncate">
                                        {server.description}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-1 mt-1 flex flex-col justify-start items-center text-xs">
                                <div className="flex flex-row justify-between items-start p-1 w-full">
                                    <span className="font-semibold">{t("mcpServer.type")}: </span>
                                    <span className="font-sans">{server.type}</span>
                                </div>
                                <div className="flex flex-row justify-between items-start p-1 w-full">
                                    <span className="font-semibold">{t("mcpServer.enableDefault")}: </span>
                                    <span className="font-sans">
                                        <Switch checked={server.enabledDefault} onCheckedChange={() => {
                                            (async () => {
                                                // await setMcpServerEnabledStatus(server.uuid, !server.enabledDefault);
                                                await setMcpServerStatus(server.uuid, !server.enabledDefault);
                                                const servers = await getAllMcpServers();
                                                setServers(servers || []);
                                            })();
                                        }} />
                                    </span>
                                </div>
                                <div className="w-full flex flex-row justify-end py-0.5 items-center">
                                    <div className="inline-flex flex-row gap-1">
                                        <Button
                                            size={"sm"}
                                            variant={"default"}
                                            className="py-0.5 h-5 w-7 text-xs rounded-sm"
                                            onClick={() => {
                                                edit(server);
                                            }}
                                        >
                                            {t("edit")}
                                        </Button>
                                        <Button
                                            variant={"outline"}
                                            size={"sm"}
                                            className="py-0.5 h-5 w-7 text-xs rounded-sm"
                                            onClick={() => {
                                                setOpen(true);
                                                setServer(server);
                                            }}
                                        >
                                            {t("mcpServer.deleteAction")}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            <Dialog open={open && server !== undefined} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>{t("mcpServer.deleteConfirm", { name: server?.name })}</DialogTitle>
                    <DialogDescription className="hidden">{t("mcpServer.delete")}</DialogDescription>
                    <span className="text-sm font-semibold text-red-400">
                        {t("mcpServer.deleteConfirm", { name: server?.name })}
                    </span>
                    <DialogFooter>
                        <div className="w-full flex flex-row-reverse gap-2">
                            <Button
                                variant={"secondary"}
                                size={"sm"}
                                onClick={() => {

                                    setOpen(false);
                                    setServer(undefined);
                                }}
                            >
                                {t("mcpServer.cancel")}
                            </Button>
                            <Button
                                variant={"default"}
                                size={"sm"}
                                className="bg-red-400/55 hover:bg-red-500"
                                onClick={() => {
                                    (async () => {
                                        await deleteMcpServer(server!.uuid);
                                        const servers = await getAllMcpServers();
                                        setServers(servers || []);
                                        setOpen(false);
                                        setServer(undefined);
                                    })()
                                }}
                            >
                                {t("mcpServer.delete")}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
