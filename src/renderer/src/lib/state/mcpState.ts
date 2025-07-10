import { create } from "zustand";
import { mcpServerInfo } from "../../../../shared/types/mcp";


interface mcpState {
    mcpServers: mcpServerInfo[],
    setMcpServers: (servers: mcpServerInfo[]) => void,
}


export const mcpServersState = create<mcpState>((set) => ({
    mcpServers: [],
    setMcpServers: (servers: mcpServerInfo[]) => set((state) => ({ ...state, mcpServers: servers })),
}))