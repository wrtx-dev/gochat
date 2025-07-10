import { FileInfo } from "@shared/types/message";
import { isYoutubeURI } from "./misc";


export async function openFile() {
    const files = await (window.api as any).openFile();
    return files
}

export async function statFile(file: string) {
    const size = await (window.api as any).statFile(file)
    return size
}

export async function getAllFilesSize(files: FileInfo[]) {
    let size = 0;
    for (const f of files) {
        if (isYoutubeURI(f.path)) {
            continue;
        }
        const s = await statFile(f.path);
        size += s;
    }
    return size;
}

export async function readFile(filepath: string) {
    return await window.api.readFile(filepath);
}

export async function saveImage(url: string) {
    return await window.api.saveImage(url);

}

export async function getFilePath(f: any) {
    return await window.api.filePath(f as any);
}


export function getMimeType(filePath: string): string {
    console.log("file path:", filePath);
    const dotIndex = filePath.lastIndexOf(".");
    const extname = dotIndex === -1 ? "" : filePath.substring(dotIndex).toLocaleLowerCase();

    // MIME 类型映射表
    const mimeTypes: { [key: string]: string } = {
        '.html': 'text/html',
        '.htm': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.md': 'text/plain',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.webm': 'video/webm',
    };

    return mimeTypes[extname] || 'application/octet-stream';
}


export function getFileIconType(filename: string): "image" | "audio" | "video" | "document" | "other" {
    const mimetype = getMimeType(filename).toLowerCase();
    if (!mimetype) {
        return 'other';
    }
    if (mimetype.startsWith("image/")) {
        return 'image';
    } else if (mimetype.startsWith("audio/")) {
        return "audio";
    } else if (mimetype.startsWith("video/")) {
        return "video";
    } else if (
        mimetype === 'application/pdf' ||
        mimetype.startsWith("text/")
    ) {
        return "document";
    } else {
        return "other";
    }

}