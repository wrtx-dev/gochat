import Dexie, { Table } from "dexie";
import { session } from "@shared/types/session";
import { Content, GroundingMetadata } from "@google/genai";
import { FileInfo } from "@shared/types/message";
import { mcpServerInfo } from "@shared/types/mcp";


export interface rawMessage {
    id?: number,
    role: "user" | "model",
    sessionID: string,
    content?: Content,
    groundMetadata?: GroundingMetadata,
    files?: FileInfo[],
    hasError?: boolean,
    errInfo?: string,
}

class SessionData extends Dexie {
    sessions!: Table<session, number>;
    rawMessages!: Table<rawMessage>;
    mcpServers!: Table<mcpServerInfo>;

    constructor() {
        super("SessionData");
        this.version(1).stores({
            sessions: "++id,updateTime,uuid",
            rawMessages: "++id,sessionID",
            mcpServers: "++id,uuid,name",
        });
    }

    async addSession(s: session): Promise<number> {
        try {
            const id = await this.sessions.add(s);
            return id;
        } catch (error) {
            throw error;
        }
    }


    async addRawMessage(msg: rawMessage): Promise<number> {
        try {
            const id = await this.rawMessages.add(msg);
            return id;
        } catch (e) {
            throw e;
        }
    }

    async getSession(id: string): Promise<session | undefined> {
        try {
            const s = await this.sessions.where("uuid").equals(id).first();
            return s;
        } catch (error) {
            throw error;
        }
    }

    async setSessionTitle(id: string, title: string): Promise<void> {
        try {
            const s = await this.sessions.where("uuid").equals(id).first();
            if (s) {
                const key = s.id!;
                this.sessions.update(key, { sessionName: title, named: true });
            }
        } catch (e) {
            throw e;
        }
    }

    async updateSessionLastUpdatedTime(id: string, lastUpdate: number): Promise<void> {
        try {
            const s = await this.sessions.where("uuid").equals(id).first();
            if (s) {
                const key = s.id!;
                this.sessions.update(key, { updateTime: lastUpdate })
            }
        } catch (e) {
            throw e;
        }
    }

    async updateSessionInstruction(id: string, instruction: string): Promise<void> {
        try {
            const s = await this.sessions.where("uuid").equals(id).first();
            if (s) {
                const key = s.id!;
                this.sessions.update(key, { instruction: instruction });
            }
        } catch (e) {
            throw e;
        }
    }

    async getRawMessageBySessionID(id: string): Promise<rawMessage[]> {
        try {
            const s = await this.rawMessages.filter((msg) => msg.sessionID === id).toArray();

            return s;
        } catch (e) {
            throw e;
        }
    }
    async getAllSessions(): Promise<session[]> {
        try {
            const ss = (await this.sessions.orderBy("updateTime").toArray()).reverse();
            return ss;
        } catch (error) {
            throw error;
        }
    }

    async updateSession(id: number, changes: Partial<session>): Promise<number> {
        try {
            const updateCount = await this.sessions.update(id, changes);
            if (updateCount === 0) {
                return 0;
            }
            return updateCount;
        } catch (e) {
            throw e;
        }
    }

    async deleteSession(uuid: string): Promise<void> {
        try {
            const s = await this.sessions.where("uuid").equals(uuid).first();
            if (s) {
                this.sessions.delete(s.id!);
            }
            await this.rawMessages.where("sessionID").equals(uuid).delete();
        } catch (e) {
            throw e;
        }
    }

    async addMcpServer(server: mcpServerInfo): Promise<number> {
        try {
            const id = this.mcpServers.add(server);
            return id;
        } catch (e) {
            throw e;
        }
    }

    async allMcpServers(): Promise<mcpServerInfo[]> {
        try {
            const servers = this.mcpServers.orderBy("id").toArray();
            return servers;
        } catch (e) {
            throw e;
        }
    }

    async deleteMcpServer(uuid: string): Promise<void> {
        try {
            const server = await this.mcpServers.where("uuid").equals(uuid).first();
            if (server) {
                const id = server.id!;
                this.mcpServers.delete(id!);
            }
        } catch (e) {
            throw e;
        }
    }

    async editMcpServer(server: mcpServerInfo): Promise<void> {
        const uuid = server.uuid;
        try {
            const srv = await this.mcpServers.where("uuid").equals(uuid).first();
            if (srv) {
                const id = srv.id!;
                await this.mcpServers.update(id, { ...server })
            }
        } catch (e) {
            throw e;
        }
    }

    async setMcpServerStatus(uuid: string, enabled: boolean): Promise<void> {
        try {
            const server = await this.mcpServers.where("uuid").equals(uuid).first();
            if (server) {
                const id = server.id;
                this.mcpServers.update(id, { enabledDefault: enabled });
            }
        } catch (e) {
            throw e;
        }
    }

}



const SessionsData = new SessionData();

export const getAllSessions = () => {
    return SessionsData.getAllSessions();
}

export const getSession = (id: string) => {
    return SessionsData.getSession(id);
}

export const addNewSessions = (s: session) => {
    return SessionsData.addSession(s);
}

export const addRawMessage = (m: rawMessage) => {
    return SessionsData.addRawMessage(m);
}

export const getRawMessageBySessionID = (id: string) => {
    return SessionsData.getRawMessageBySessionID(id);
}

export const setSessionTitle = (id: string, title: string) => {
    return SessionsData.setSessionTitle(id, title);
}

export const updateSessionInstruction = (id: string, instruction: string) => {
    return SessionsData.updateSessionInstruction(id, instruction);
}

export const deleteSession = (uuid: string) => {
    return SessionsData.deleteSession(uuid);
}

export const updateSessionLastUpdate = (uuid: string) => {
    return SessionsData.updateSessionLastUpdatedTime(uuid, Math.floor(Date.now() / 1000));
}

export const addMcpServer = (server: mcpServerInfo) => {
    return SessionsData.addMcpServer(server);
}

export const getAllMcpServers = () => {
    return SessionsData.allMcpServers();
}

export const deleteMcpServer = (uuid: string) => {
    return SessionsData.deleteMcpServer(uuid);
}

export const setMcpServerStatus = (uuid: string, enabled: boolean) => {
    return SessionsData.setMcpServerStatus(uuid, enabled);
}

export const editMcpServer = (server: mcpServerInfo) => {
    return SessionsData.editMcpServer(server);
}