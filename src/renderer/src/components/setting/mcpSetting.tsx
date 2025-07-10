import { mcpServersState } from "@renderer/lib/state/mcpState";
import { McpServerEditor } from "./mcp/mcpServerAction";
import McpServerTable from "./mcp/mcpServerList";
import { useTranslation } from "react-i18next";
import { useRef } from "react";


export default function McpSetting() {
    const servers = mcpServersState((state) => state.mcpServers);
    const { t } = useTranslation();
    const ref = useRef<any>(null);
    return (
        <div className="w-full flex-1 flex flex-col round-sm p-2">
            <div className="flex flex-row h-10 justify-between items-center w-full py-2">
                <span className="font-semibold select-none cursor-default text-neutral-800/70">{t("mcpServerList")}</span>
                <McpServerEditor ref={ref} />
            </div>
            <McpServerTable servers={servers} edit={(server) => {
                if (ref && ref.current) {
                    ref.current.editMcpServer(server);
                }
            }} />
        </div>
    )
}
