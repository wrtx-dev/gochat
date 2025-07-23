import { Config } from "@renderer/lib/data/config";
import { GeminiToolType } from "@shared/types/session";

export interface modelSimpleInfo {
    name: string,
    displayName: string
}
export async function getModels(conf: Config) {
    const url = new URL(conf.endPoint && conf.endPoint !== "" ? `${conf.endPoint}v1beta/models` : "https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.append('key', conf.apikey);
    url.searchParams.append('pageSize', "500")
    try {
        const response = await fetch(url.toString(), {
            method: "GET"
        })
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${errorBody}`);
        }
        const data = await response.json();
        const models = ((data as any).models as any[]).filter((v) => {
            return ((v as any).name as string).indexOf("gemini") >= 0 && ((v as any).name as string).indexOf("embed") < 0
        });
        let modelInfos: modelSimpleInfo[] = [];
        models.map((v) => {
            const name = (v as any).name;
            const displayName = (v as any).displayName;
            if (getModelVersionNumber(name) < 2.0) {
                return;
            }
            modelInfos = [...modelInfos, {
                name,
                displayName
            }]
        });
        return modelInfos;
    } catch (e) {
        throw new Error(`list models error ${e}`)
    }
}

export async function saveModelsList(models: modelSimpleInfo[]) {
    localStorage.setItem("model-list", JSON.stringify(models));
}

export async function getModelsList() {
    const ls = await localStorage.getItem("model-list");
    if (ls) {
        return JSON.parse(ls) as modelSimpleInfo[];
    }
    return null;
}


export const getModelDisplayName = (name: string, models: modelSimpleInfo[]) => {
    for (const item of models) {
        if (item.name === name) {
            return item.displayName;
        }
    }
    return "未选择模型";
}

export const autoGetModelDisplayName = async (name: string) => {
    const models = await getModelsList();
    if (models) {
        return getModelDisplayName(name, models);
    }
    return "unknow model name";
}
export const setModelsTagMap = (models: modelSimpleInfo[]) => {
    const maps: Map<string, modelSimpleInfo[]> = new Map<string, modelSimpleInfo[]>();
    models.map((m) => {
        const match = m.displayName.match(/^.*?\s.*?(?=\s)/);
        const result = match ? match[0] : "untag";
        const infos = maps.get(result);
        if (infos) {
            maps.set(result, [...infos, m]);
        } else {
            maps.set(result, [m]);
        }
    });
    return maps;
}

export const getModelStringVersion = (model: string) => {
    const regex = /(?:gemini|models\/gemini)-(\d+\.\d+)-(?:pro|flash).*/;
    const match = regex.exec(model);
    if (!match || !match[1]) {
        return undefined;
    }
    return match[1];
}

export const getModelVersionNumber = (model: string) => {
    const v = getModelStringVersion(model);
    const r = parseFloat(v || "1.0");
    return r;
}

export const checkToolAvialable = (name: GeminiToolType, toolSet: GeminiToolType[], model: string) => {
    if (toolSet.length === 0) {
        return true;
    }

    const version: string = getModelStringVersion(model) || "1.0";
    switch (name) {
        case "function":
            return toolSet.includes("function");
        case "codeExec":
            if (toolSet.includes("codeExec")) {
                return true;
            }
            if (version === "2.5") {
                return toolSet.length === 1 && toolSet.includes("search");
            }
            return false;
        case "search":
            if (toolSet.includes("search")) {
                return true;
            }
            if (version === "2.5" && toolSet.length === 1) {
                return toolSet.includes("codeExec") || toolSet.includes("urlContext");
            }
            if (version === "2.0" && toolSet.length === 1) {
                return toolSet.includes("urlContext");
            }
            return false;
        case "urlContext":
            if (toolSet.includes("urlContext")) {
                return true;
            }
            if (version === "2.5" && toolSet.length === 1) {
                return toolSet.includes("search");
            }
            if (version === "2.0" && toolSet.length === 1) {
                return toolSet.includes("search");
            }
            return false;
    }
    return true;
}