export interface session {
    id?: number
    model: string
    apikey: string
    createTime: number
    updateTime: number
    sessionName: string
    named: boolean
    uuid: string
    instruction: string
}

export type GeminiToolType = "codeExec" | "search" | "function" | "urlContext";