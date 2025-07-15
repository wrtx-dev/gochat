import { FunctionCall, Part } from "@google/genai";
import { runMcpTool } from "../util/mcpIpc";


export async function runMcpTools(funcs: FunctionCall[]) {
    const res: any[] = [];
    let parts: Part[] = [];
    for (const fun of funcs) {
        const r = await runMcpTool(fun);
        res.push(r);
        parts.push({
            functionResponse: {
                id: fun.id,
                name: fun.name,
                response: r,
            }
        });
    }
    return parts;
}