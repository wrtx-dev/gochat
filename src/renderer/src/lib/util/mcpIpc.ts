import { FunctionCall } from "@google/genai";
import { mcpServerInfo } from "@shared/types/mcp";

export const startMcpServers = async (servers: mcpServerInfo[]) => {
    await window.api.startMcpServers(servers);
}

export const stopMcpServers = async () => {
    await window.api.stopMcpServers();
}

export const listMcpTools = async () => {
    return await window.api.listMcpTools();
}

export const startMcpServer = async (server: mcpServerInfo) => {
    return await window.api.startMcpServer(server);
}

export const stopMcpServer = async (server: mcpServerInfo) => {
    return await window.api.stopMcpServer(server);
}

export const runMcpTool = async (func: FunctionCall) => {
    return window.api.runMcpTool(func);
}