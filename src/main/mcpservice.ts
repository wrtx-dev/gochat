import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { mcpServerInfo } from "@shared/types/mcp";
import { FunctionDeclaration, Type, FunctionCall } from "@google/genai"

interface ClientMapItem {
    client: Client,
    transport: Transport,
    server: mcpServerInfo,
}
export class McpClients {
    private clientMap: Map<string, ClientMapItem> = new Map<string, ClientMapItem>();
    private funcs?: FunctionDeclaration[];
    private funcMap?: Map<string, FunctionDeclaration[]>;
    private funcClientMap?: Map<string, string>;
    constructor() {
        this.clientMap = new Map<string, ClientMapItem>();
    }

    public async startServers(servers: mcpServerInfo[]) {
        if (servers.length < 1) {
            return false
        }
        for (const server of servers) {
            if (!server.enabledDefault) {
                continue;
            }
            const client = new Client({
                name: `${server.name}-client`,
                version: "0.0.1",
            });
            switch (server.type) {
                case "stdio":
                    {
                        let env: Record<string, string> = {};
                        server.env.split(",").map((ev) => {
                            const se = ev.split("=");
                            if (se.length === 2) {
                                env[se[0]] = se[1];
                            }
                        })
                        const args = server.cmd.split(" ");
                        if (args.length < 1) {
                            continue;
                        }
                        const transport = new StdioClientTransport({
                            command: args[0],
                            args: args.length > 1 ? [...args.splice(1)] : [],
                            env: Object.keys(env).length > 0 ? env : undefined,
                        });
                        this.clientMap.set(server.uuid, { client: client, transport: transport, server });
                    }
                    break;
                case "sse":
                    {
                        const transport = new SSEClientTransport(new URL(server.url));
                        this.clientMap.set(server.uuid, { client, transport, server })
                    }
                    break;
                case "httpstream":
                    {
                        const transport = new StreamableHTTPClientTransport(new URL(server.url));
                        this.clientMap.set(server.uuid, { client, transport, server })
                    }
            }
        }
        if (this.clientMap.keys().toArray().length < 1) {
            return false;
        }
        const count = await this.startClient();
        return count > 0;
    }


    private typeOfScheme(value: string) {
        let objType = Type.TYPE_UNSPECIFIED;
        switch (value) {
            case "integer":
                objType = Type.INTEGER;
                break;
            case "number":
                objType = Type.NUMBER;
                break;
            case "boolean":
                objType = Type.BOOLEAN;
                break;
            case "array":
                objType = Type.ARRAY;
                break;
            case "undefined":
                objType = Type.TYPE_UNSPECIFIED;
                break;
            case "string":
                objType = Type.STRING;
                break;
            case "object":
                objType = Type.OBJECT;
                break;
        }
        return objType;
    }

    private async collectTools(client: ClientMapItem) {
        const tools = await client.client.listTools();
        for (const tool of tools.tools) {
            let func: FunctionDeclaration = {};
            func.name = tool.name;
            func.description = tool.description;
            func.parameters = {};
            func.parameters.properties = {};
            func.parameters.type = this.typeOfScheme(tool.inputSchema.type);
            for (const key of Object.keys(tool.inputSchema.properties!)) {
                const value = tool.inputSchema.properties![key];
                if (value) {
                    func.parameters.properties[key] = {};
                    for (const k of Object.keys(value)) {
                        const typeValue = value[k];
                        if (k.toLowerCase() === "type") {
                            func.parameters.properties[key]["type"] = this.typeOfScheme(typeValue);
                        } else if (k.toLowerCase() === "description") {
                            func.parameters.properties[key][k] = typeValue;
                        } else if (k.toLowerCase() === "enum") {
                            func.parameters.properties[key][k] = typeValue;
                        } else if (k.toLowerCase() === "default") {
                            func.parameters.properties[key][k] = typeValue;
                        }
                    }

                }
            }
            func.parameters.required = tool.inputSchema.required;
            if (!this.funcs) {
                this.funcs = [];
            }
            this.funcs = [...this.funcs, func];
            if (!this.funcMap) {
                this.funcMap = new Map<string, FunctionDeclaration[]>();
            }
            const funcs = this.funcMap.get(client.server.uuid);
            if (funcs) {
                this.funcMap.set(client.server.uuid, [...funcs, func]);
            } else {
                this.funcMap.set(client.server.uuid, [func]);
            }
            if (!this.funcClientMap) {
                this.funcClientMap = new Map();
            }
            this.funcClientMap.set(func.name!, client.server.uuid);
        }
    }

    private async startClient() {
        let count = 0;
        for (const [_key, client] of this.clientMap) {
            if (!client.server.enabledDefault) {
                continue;
            }
            try {
                await client.client.connect(client.transport);
                await this.collectTools(client);
            } catch (e) {
                console.error(e);
            }

        }
        return count;
    }

    private async stopClient() {
        for (const [_, client] of this.clientMap) {
            if (client.server.enabledDefault) {
                client.client.close();
            }
        }
        this.clientMap = new Map<string, ClientMapItem>();
        this.funcMap = undefined;
        this.funcs = undefined;
        this.funcClientMap = undefined;
    }
    public async StopServers() {
        await this.stopClient();
    }

    public async StopServerByUUID(uuid: string) {
        const server = this.clientMap.get(uuid);
        if (server) {
            this.clientMap.delete(uuid);
            await server.client.close();
            let keys: string[] = [];
            for (const [key, value] of this.funcClientMap!) {
                if (value === uuid) {
                    keys = [...keys, key]
                }
            }
            this.funcMap?.delete(uuid);
            for (const key of keys) {
                this.funcClientMap?.delete(key);
            }
        }
    }

    public async StartServer(server: mcpServerInfo) {
        let clientItem: ClientMapItem | undefined = undefined
        const client = new Client({
            name: `${server.name}-client`,
            version: "0.0.1",
        });
        switch (server.type) {
            case "stdio":
                {
                    const args = server.cmd.split(" ");
                    if (args.length < 1) {
                        return
                    }
                    const transport = new StdioClientTransport({
                        command: args[0],
                        args: args.length > 1 ? [...args.splice(1)] : [],
                    });
                    clientItem = { client: client, transport: transport, server };
                    this.clientMap.set(server.uuid, clientItem!);
                }
                break;
            case "sse":
                {
                    const transport = new SSEClientTransport(new URL(server.url));
                    clientItem = { client, transport, server };
                    this.clientMap.set(server.uuid, clientItem!);
                }
                break;
            case "httpstream":
                {
                    const transport = new StreamableHTTPClientTransport(new URL(server.url));
                    clientItem = { client, transport, server };
                    this.clientMap.set(server.uuid, clientItem!);
                }
        }
        await clientItem.client.connect(clientItem.transport);
        await this.collectTools(clientItem);
        return true;
    }

    public async runTool(args: FunctionCall) {
        const name = args.name;
        const arg = args.args;
        const uuid = this.funcClientMap!.get(name!);
        let res: undefined | any = undefined;
        if (uuid) {
            const client = this.clientMap.get(uuid);
            if (client) {
                res = await client.client.callTool({
                    name: name!,
                    arguments: arg,
                })
            }
        }
        return res;
    }

    public async ListTools() {
        if (!this.funcMap) {
            return [];
        }
        let funcs: FunctionDeclaration[] = [];
        for (const [_, value] of this.funcMap) {
            funcs = [...funcs, ...value]
        }
        return funcs;
    }
}

const mcpService = new McpClients();

export const startMcpServers = async (servers: mcpServerInfo[]) => {
    await mcpService.startServers(servers);
}

export const stopMcpServers = async () => {
    await mcpService.StopServers();
}

export const listTools = async () => {
    return await mcpService.ListTools();
}

export const runTool = async (args: FunctionCall) => {
    return await mcpService.runTool(args);
}

export const startMcpServer = async (server: mcpServerInfo) => {
    return await mcpService.StartServer(server);
}

export const stopMcpServer = async (server: mcpServerInfo) => {
    return await mcpService.StopServerByUUID(server.uuid);
}