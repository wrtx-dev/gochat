import { app, dialog } from "electron";
import path from "path";
import fs from "fs/promises";

export async function saveImage(win: Electron.BaseWindow, url: string, suggestedFilename: string = 'uname') {
    let buf: Buffer;
    let defaultExtension: string = '';
    if (url.startsWith("data:")) {
        buf = dataURLtoBuffer(url);
        const mimeMatch = url.split(',')[0].match(/:(.*?);/);
        if (mimeMatch) {
            defaultExtension = mimeMatch[1].split('/')[1]; // 例如 'image/png' -> 'png'
        }
    } else {
        buf = await urlToBuffer(url);
        const urlPath = new URL(url).pathname;
        defaultExtension = path.extname(urlPath).substring(1);
    }
    let filenameWithExt = suggestedFilename;
    if (!path.extname(suggestedFilename) && defaultExtension) {
        filenameWithExt = `${suggestedFilename}.${defaultExtension}`;
    } else if (!path.extname(suggestedFilename)) {
        // 如果实在无法推断，给个默认的
        filenameWithExt = `${suggestedFilename}.bin`;
    }

    // 显示保存文件对话框
    console.log("show image save dialog")
    const { canceled, filePath } = await dialog.showSaveDialog(win!, {
        title: '保存图片',
        defaultPath: path.join(app.getPath('downloads'), filenameWithExt), // 默认下载目录
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', defaultExtension].filter(Boolean) }, // 过滤掉空字符串
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (canceled || !filePath) {
        return { success: false, message: '用户取消了保存操作。' };
    }

    // 将Buffer写入文件
    await fs.writeFile(filePath, buf);
    return { success: true, message: `图片已保存到: ${filePath}` };

}

function dataURLtoBuffer(dataurl: string): Buffer {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid Data URL format: MIME type missing.');
    }
    const bstr = Buffer.from(arr[1], 'base64');
    return bstr;
}

async function urlToBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}