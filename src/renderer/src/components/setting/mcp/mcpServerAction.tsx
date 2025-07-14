import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { Button } from "@renderer/components/ui/button";
import { addMcpServer, editMcpServer, getAllMcpServers } from "@renderer/lib/data/db";
import { mcpServersState } from "@renderer/lib/state/mcpState";
import { mcpServerInfo } from "@shared/types/mcp";
import { forwardRef, Ref, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";


const McpServerAction = forwardRef(({ }: {}, ref: Ref<any>) => {
    const [open, setOpen] = useState(false);
    const setMcpServers = mcpServersState((state) => state.setMcpServers);
    const [action, setAction] = useState<"edit" | "add">("add");
    const genEmptyServer = () => ({
        name: "",
        description: "",
        cmd: "",
        enabledDefault: false,
        url: "",
        type: "stdio",
        uuid: "",
        env: "",
    } as mcpServerInfo)
    const [mcpServer, setMcpServer] = useState<mcpServerInfo>(genEmptyServer());
    const { t } = useTranslation();
    useImperativeHandle(ref, () => ({
        addMcpServer: () => {
            setAction(prev => {
                if (prev !== "add") {
                    setMcpServer(genEmptyServer());
                    return "add";
                }
                return prev;
            });
            setOpen(true);
        },
        editMcpServer: (server: mcpServerInfo) => {
            setMcpServer(server);
            setAction("edit");
            setOpen(true);
        }
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <span className="inline-block select-none">
                    <Button className="py-1 bg-red-400/65 hover:bg-red-500" variant={"destructive"} size={"default"}>{action === "add" ? t("mcpServer.addServer") : t("mcpServer.addServer")}</Button>
                </span>
            </DialogTrigger>
            <DialogContent className="p-2">
                <DialogTitle className="text-sm select-none cursor-default">{t("mcpServer.addServer")}</DialogTitle>
                <DialogDescription className="hidden">{t("mcpServer.editServer")}</DialogDescription>
                <div className="flex flex-col w-full bg-transparent gap-x-2 gap-y-1 p-2 text-xs">
                    <span className="text-xs font-semibold">{t("mcpServer.name")}</span>
                    <Input className="comm-input"
                        value={mcpServer.name}
                        onChange={(e) => setMcpServer((prev) => ({ ...prev, name: e.target.value }))}
                        spellCheck={false}
                    />
                    <span className="text-xs font-semibold">{t("mcpServer.description")}</span>
                    <Textarea
                        className="comm-textarea"
                        value={mcpServer.description}
                        onChange={(e) => setMcpServer(prev => ({ ...prev, description: e.target.value }))}
                        spellCheck={false}
                    />
                    <span className="text-xs font-semibold">{t("mcpServer.type")}</span>
                    <RadioGroup
                        value={mcpServer.type}
                        onValueChange={(v) => setMcpServer(prev => ({ ...prev, type: v as "stdio" | "sse" }))}
                    >
                        <div className="flex flex-row items-center gap-4">
                            <RadioGroupItem id={`stdio`} value="stdio">{t("mcpServer.stdio")}</RadioGroupItem>
                            <Label htmlFor={`stdio`} className="text-xs font-semibold">{t("mcpServer.stdio")}</Label>
                            <RadioGroupItem id={`sse`} value="sse">{t("mcpServer.sse")}</RadioGroupItem>
                            <Label htmlFor={`sse`} className="text-xs font-semibold">{t("mcpServer.sse")}</Label>
                            <RadioGroupItem id={`sse`} value="httpstream">{t("mcpServer.httpStream")}</RadioGroupItem>
                            <Label htmlFor={`sse`} className="text-xs font-semibold">{t("mcpServer.httpStream")}</Label>
                        </div>
                    </RadioGroup>
                    {mcpServer.type === "stdio" ? <>
                        {/* <span className="text-xs font-semibold">{t("mcpServer.cmd")}</span>
                        <Input
                            className="comm-input"
                            value={mcpServer.cmd.split(" ")[0]}
                            onChange={(e) => setMcpServer(prev => ({ ...prev, cmd: [e.target.value, ...prev.cmd.split(" ").slice(1)].join(" ") }))}
                            spellCheck={false}
                        /> */}
                        <span className="text-xs font-semibold">{t("mcpServer.cmd")}</span>
                        <Textarea
                            className="comm-textarea"
                            value={mcpServer.cmd.length > 0 ? mcpServer.cmd : ""}
                            onChange={(e) => setMcpServer(prev => ({ ...prev, cmd: e.target.value }))}
                            spellCheck={false}
                        />
                        <span className="text-xs font-semibold">{t("mcpServer.env")}</span>
                        <Textarea
                            className="comm-textarea"
                            value={mcpServer.env}
                            onChange={(e) => setMcpServer(prev => ({ ...prev, env: e.target.value }))}
                            spellCheck={false}
                        />
                    </> : <>
                        <span className="text-xs font-semibold">{t("mcpServer.url")}</span>
                        <Input
                            className="comm-input"
                            value={mcpServer.url}
                            onChange={(e) => setMcpServer(prev => ({ ...prev, url: e.target.value }))}
                            spellCheck={false}
                        />
                    </>}
                    <div className="inline-flex flex-row items-center align-baseline gap-2">
                        <Label htmlFor="enableDefaultToggle" className="text-xs">{t("mcpServer.enableDefault")}</Label>
                        <Switch
                            id="enableDefalutToggle"
                            className="focus-visible:ring-0"
                            checked={mcpServer.enabledDefault}
                            onCheckedChange={(v) => setMcpServer(prev => ({ ...prev, enabledDefault: v }))}
                        />
                    </div>
                    <div className="flex flex-row-reverse w-full mt-3 gap-2">
                        <Button
                            variant={"default"}
                            size={"sm"}
                            className="btn  btn-soft border-none btn-sm"
                            onClick={() => setOpen(false)}
                        >
                            {t("mcpServer.cancel")}
                        </Button>
                        <Button
                            className="btn btn-success border-none btn-sm"
                            variant={"secondary"}
                            size={"sm"}
                            onClick={() => {
                                (async () => {
                                    try {
                                        if (action === "add") {
                                            mcpServer.uuid = crypto.randomUUID();
                                            await addMcpServer(mcpServer);
                                        } else {
                                            await editMcpServer(mcpServer);
                                        }
                                        setOpen(false);
                                        setMcpServer(genEmptyServer())
                                        const servers = await getAllMcpServers();
                                        setMcpServers(servers || []);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                })()
                            }}
                        >
                            {t("save")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
})

export const McpServerEditor = McpServerAction;