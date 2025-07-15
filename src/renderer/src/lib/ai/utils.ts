import { Content, FunctionCall, GroundingMetadata, Part } from "@google/genai";
import { FileInfo } from "@shared/types/message";
import { isYoutubeURI } from "../util/misc";
import { getMimeType, readFile } from "../util/files";


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
    if (groundData) {
        if (groundData.searchEntryPoint?.renderedContent) {
            text += "\n" + groundData.searchEntryPoint.renderedContent + "\n";
        }
    }
    return thinking ? { thinking: text.length > 0 ? text : undefined, msgText: undefined, fcall: fc } : {
        thinking: undefined,
        msgText: text.length > 0 ? text : undefined,
        fcall: fc,
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