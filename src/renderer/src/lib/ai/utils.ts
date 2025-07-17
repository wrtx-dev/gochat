import { Content, FunctionCall, GroundingMetadata, Part } from "@google/genai";
import { FileInfo, Message } from "@shared/types/message";
import { isYoutubeURI } from "../util/misc";
import { getMimeType, readFile } from "../util/files";
import { getRawMessageBySessionID } from "../data/db";


export function createMessageText(content?: Content, groundData?: GroundingMetadata) {
    let text = "";
    let thinking = false;
    let fc: undefined | FunctionCall[] = undefined;
    if (content && content.parts) {
        const p = content.parts[0];
        if (p.thought) {
            thinking = true;
        }
        if (p.text) {
            text += p.text;
        }
        if (p.executableCode) {
            text += "\ncode exec:\n```" + p.executableCode.language + "\n" + p.executableCode.code + "\n```";
        }
        if (p.codeExecutionResult) {
            text += "\n code run result:\n" + p.codeExecutionResult.output || "" + "\n"
        }
        if (p.inlineData) {
            const dataURL = "data:" + p.inlineData.mimeType + ";base64," + p.inlineData.data;
            text += `\n<img src="http://dev.xwrt.aichatter/${dataURL}" alt="gen image">\n`;
        }
        for (const fp of content.parts) {
            if (fp.functionCall) {
                if (!fc) {
                    fc = [];
                }
                fc = [...fc, fp.functionCall];
            }
        }
    }
    let supports: Map<string, string> | undefined = undefined;
    let renderedContent: string | undefined = undefined;
    if (groundData) {
        if (groundData.searchEntryPoint?.renderedContent) {
            renderedContent = "\n" + groundData.searchEntryPoint.renderedContent + "\n";
        }
        if (groundData.groundingSupports && groundData.groundingChunks) {
            if (!supports) {
                supports = new Map<string, string>();
            }
            for (const support of groundData.groundingSupports) {
                if (support.segment && support.segment.text && support.groundingChunkIndices) {
                    if (support.groundingChunkIndices.length > 0) {
                        let links = "";
                        for (const index of support.groundingChunkIndices) {
                            const chunk = groundData.groundingChunks[index];
                            if (chunk.web && chunk.web.uri) {
                                const title = chunk.web.title ? chunk.web.title : chunk.web.domain ? chunk.web.domain : `${index}`;
                                links += `[${title}](${chunk.web.uri}) `;
                            }
                        }
                        supports.set(support.segment.text, `${support.segment.text} [${links.trim()}]`);

                    }
                }
            }
        }
    }
    return thinking ? { thinking: text.length > 0 ? text : undefined, msgText: undefined, fcall: fc, supports: supports, renderedContent } : {
        thinking: undefined,
        msgText: text.length > 0 ? text : undefined,
        fcall: fc,
        supports: supports,
        renderedContent: renderedContent
    };
}


export async function genFileContent(msg: string, files?: FileInfo[]) {
    let fileInfos: undefined | FileInfo[] = undefined;
    let contents: undefined | Part[] = undefined;
    if (files) {
        for (const f of files) {
            if (!fileInfos) {
                fileInfos = [];
            }
            if (!contents) {
                contents = [];
            }
            if (isYoutubeURI(f.path)) {
                fileInfos = [...fileInfos, {
                    fileType: "",
                    path: f.path,
                    youtube: f.youtube,
                    ytFps: f.ytFps,
                    ytStart: f.ytStart,
                    ytStop: f.ytStop,
                }];
                const p: Part = {
                    fileData: {
                        fileUri: f.path,
                    },
                    videoMetadata: {
                        startOffset: f.ytStart ? `${f.ytStart}s` : undefined,
                        endOffset: f.ytStop ? `${f.ytStop}s` : undefined,
                        fps: f.ytFps,
                    }
                }
                contents = [...contents, p];
                continue;
            }
            fileInfos = [...fileInfos, {
                fileType: getMimeType(f.path),
                path: f.path
            }];
            const data = await readFile(f.path);


            contents = [...contents, {
                inlineData: {
                    mimeType: getMimeType(f.path),
                    data: data
                }
            }]
        }
        // const size = await getAllFilesSize(files);
    }
    if (contents) {
        contents = [{ text: msg }, ...contents]
    }
    return { fileInfos, contents }
}

export async function createMessageListFromRawMessage(id: string) {
    let messages: Message[] = [];
    const rawMessages = await getRawMessageBySessionID(id);
    let messageTurn = 0;
    let tmpMessage: Message | undefined = undefined;
    let role: undefined | string = undefined;
    let isNew = false;
    for (const rawMsg of rawMessages) {
        if (rawMsg.role && rawMsg.role != role) {
            messageTurn += rawMsg.role === "user" ? 1 : 0;
            isNew = true;
            role = rawMsg.role;
            if (tmpMessage) {
                messages = [...messages, { ...tmpMessage }];
            }
            tmpMessage = undefined;
        }
        const { thinking, msgText, fcall, supports, renderedContent } = createMessageText(rawMsg.content, rawMsg.groundMetadata);
        if (thinking || msgText || fcall || rawMsg.hasError) {
            if (!tmpMessage) {
                tmpMessage = {
                    role: rawMsg.role === "user" ? "user" : "assistant",
                    id: crypto.randomUUID(),
                    message: msgText ? msgText : "",
                    thinking: thinking,
                    isError: rawMsg.role !== "user" && rawMsg.hasError ? rawMsg.hasError : false,
                    errInfo: rawMsg.role !== "user" && rawMsg.hasError && rawMsg.errInfo ? rawMsg.errInfo : "",
                    files: rawMsg.files ? rawMsg.files : [],
                    hasFuncCall: fcall ? fcall.length > 0 : false,
                    funcCalls: fcall ? fcall : [],
                    finished: true,
                    sessionID: id,
                    renderedContent: renderedContent,
                }
            } else if (tmpMessage) {
                if (msgText) {
                    tmpMessage.message += msgText;
                }
                if (thinking) {
                    tmpMessage.thinking = tmpMessage.thinking ? tmpMessage.thinking + thinking : thinking;
                }
                if (fcall && fcall.length > 0) {
                    tmpMessage.hasFuncCall = true;
                    tmpMessage.funcCalls = [...tmpMessage.funcCalls, ...fcall];
                }
                if (renderedContent) {
                    tmpMessage.renderedContent = renderedContent;
                }
                if (rawMsg.hasError) {
                    tmpMessage.isError = true;
                    tmpMessage.errInfo = rawMsg.errInfo ? rawMsg.errInfo : "";
                }
                if (rawMsg.files && rawMsg.files.length > 0) {
                    tmpMessage.files = [...tmpMessage.files, ...rawMsg.files];
                }
            }
            if (supports && supports.size > 0) {
                [...Array.from(supports.keys())].map((key) => {
                    const v = supports.get(key);
                    if (tmpMessage && tmpMessage.message) {
                        tmpMessage.message = tmpMessage.message.replace(key, v || key);
                    }
                })
            }
            if (isNew) {
                isNew = !isNew;
            }
        }
    }
    if (tmpMessage) {
        messages = [...messages, { ...tmpMessage }];
    }
    return { messages: messages, messageTurn: messageTurn }
}