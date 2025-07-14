export interface mcpServerInfo {
    id?: number
    name: string
    description: string
    cmd: string
    uuid: string
    type: "stdio" | "sse" | "http stream"
    env: string
    enabledDefault: boolean
    url: string
}

export const cmdStartMcpServers = "start-mcp-servers";
export const cmdStopMcpServers = "stop-mcp-servers";
export const cmdListMcpTools = "list-mcp-tools";
export const cmdRunMcpTool = "run-mcp-tool";
export const cmdStartMcpServer = "start-mcp-server";
export const cmdStopMcpServer = "stop-mcp-server";