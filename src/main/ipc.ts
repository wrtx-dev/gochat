import { cmdListMcpTools, cmdRunMcpTool, cmdStartMcpServer, cmdStartMcpServers, cmdStopMcpServer, cmdStopMcpServers } from "@shared/types/mcp";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { listTools, runTool, startMcpServer, startMcpServers, stopMcpServer, stopMcpServers } from "./mcpservice";
import { mcpServerInfo } from "@shared/types/mcp";
import { FunctionCall } from "@google/genai";
import { cmdChangeAppLang, cmdCreateAppTray, cmdCreateQuickWindow, cmdDestroyAppTray, cmdDestroyQuickWindow, cmdGlobalNotifyConfChanged, cmdHideQuickWin, cmdRecalcShadow, cmdResizeWindow, cmdSaveImage, cmdScreenShot, cmdScreenShotResponse, cmdSetQuickWinIgnoreMouse } from "@shared/types/cmd";
import { saveImage } from "./saveFile";
import { deleteAppicationMenu, setupApplicationMenu } from "./appMenu";
import { changeTrayLang, createTray, destroyTray } from "./tray";
import { changeLang } from "./i18";
import { promises as fs } from "fs"
import { createQuickWindowWithGlobalShortCut, destroyQuickWindow, hideQuickWindow, notifyQuickWindowConfChanged, quickWindow, resetQuickWindowShadow, resizeQuickWindow } from "./quickWindow";
import { EnumQuickWinHotKey } from "@shared/types/config";
import Screenshot from "electron-screenshots";
import { join } from "path";



let ipcInited = false;
export const ipcInit = () => {
    if (ipcInited) {
        return;
    }
    ipcInited = true;
    ipcMain.on("close-window", () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.close();
        }
    })

    ipcMain.on("minimize-window", () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.minimize();
        }
    })

    ipcMain.on("maximize-window", () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            if (win.isMaximized()) {
                win.unmaximize();
            } else {
                win.maximize();
            }
        }
    })
    ipcMain.handle(cmdStartMcpServers, async (_ev, servers: mcpServerInfo[]) => {
        await startMcpServers(servers);
    });
    ipcMain.handle(cmdStopMcpServers, async (_ev) => {
        await stopMcpServers();
    });
    ipcMain.handle(cmdListMcpTools, async (_ev) => {
        return await listTools();
    });
    ipcMain.handle(cmdRunMcpTool, async (_ev, args: FunctionCall) => {
        return await runTool(args);
    });
    ipcMain.handle(cmdStartMcpServer, async (_ev, server: mcpServerInfo) => {
        return await startMcpServer(server);
    });
    ipcMain.handle(cmdStopMcpServer, async (_ev, server: mcpServerInfo) => {
        return await stopMcpServer(server);
    });
    ipcMain.handle(cmdSaveImage, async (_ev, src: string) => {
        const win = BrowserWindow.fromWebContents(_ev.sender);
        console.log("will save image");
        if (!win) {
            return { success: false, message: '出现错误' }
        }
        try {
            console.log("try to save image")
            return await saveImage(win, src);
        } catch (e) {
            console.log("save image err:", e);
            return { success: false, message: `保存文件出现错误:${e}` }
        }
    });




    ipcMain.handle("readFile", async (_event, filepath: string) => {
        try {
            const fdata = await fs.readFile(filepath, { encoding: "base64" });
            return fdata;
        } catch (e) {
            throw e;
        }
    })

    ipcMain.handle("GetFileInfo", async (_event, filepath: string): Promise<number> => {
        try {
            if (!filepath || filepath.length === 0) {
                throw new Error("文件路径不能为空");
            }
            const stats = fs.stat(filepath);
            // console.log((await stats).size);
            return (await stats).size;
        } catch (e) {
            throw e;
        }
    });



    ipcMain.on(cmdSetQuickWinIgnoreMouse, async (_ev, ignore: boolean) => {
        if (quickWindow) {

            quickWindow.setIgnoreMouseEvents(ignore, {
                forward: true,
            });

        }
    });

    ipcMain.on(cmdHideQuickWin, async (_ev) => {
        hideQuickWindow();
    });

    ipcMain.on(cmdRecalcShadow, async (_ev) => {
        resetQuickWindowShadow();
    });

    ipcMain.on(cmdResizeWindow, async (_ev, size: { w: number, h: number }) => {
        resizeQuickWindow(size);
    });

    ipcMain.on(cmdGlobalNotifyConfChanged, async () => {
        notifyQuickWindowConfChanged();
    });


    ipcMain.on(cmdCreateQuickWindow, async (_ev, accelerator: EnumQuickWinHotKey) => {
        let setAccelerator = "Ctrl+Alt+Space";
        switch (accelerator) {
            case EnumQuickWinHotKey.AltSpace:
                setAccelerator = "Alt+Space";
                break;
            case EnumQuickWinHotKey.CtrlAltSpace:
                setAccelerator = "Ctrl+Alt+Space";
                break;
            case EnumQuickWinHotKey.CtrlShiftSpace:
                setAccelerator = "Ctrl+Shift+Space";
                break;
        }
        createQuickWindowWithGlobalShortCut(setAccelerator);
    });

    ipcMain.on(cmdDestroyQuickWindow, async () => {
        destroyQuickWindow();
    })



    ipcMain.on(cmdDestroyAppTray, async () => {
        destroyTray();
    });

    ipcMain.handle(cmdChangeAppLang, async (_ev, lang: string) => {
        await changeLang(lang);
        deleteAppicationMenu();
        setupApplicationMenu();
        changeTrayLang();
    });

    ipcMain.on(cmdScreenShot, async (ev) => {
        const screenShot = new Screenshot();
        const win = BrowserWindow.fromWebContents(ev.sender);
        screenShot.startCapture();
        screenShot.on("ok", async (_e, buffer, _bounds) => {
            const filename = await saveScreenShot(buffer);
            if (win && win.webContents) {
                win.webContents.send(cmdScreenShotResponse, filename);
                return;
            }
            return undefined;
        });
    })

}

const saveScreenShot = async (data: Buffer) => {
    const dataDir = app.getPath('userData');
    const shotDir = join(dataDir, "screenShot");
    await fs.mkdir(shotDir, { recursive: true });
    const now = Date.now();
    const screenShotPicName = join(shotDir, `screenshot-${now}.png`);
    await fs.writeFile(screenShotPicName, data);
    return screenShotPicName;
}
let mainIpcInited = false;
export const mainWindowIpcInit = (mainWindow: BrowserWindow) => {
    if (mainIpcInited) {
        return;
    }
    mainIpcInited = true;
    ipcMain.on(cmdCreateAppTray, async () => {
        createTray(mainWindow);
    });

    ipcMain.handle("ChatWindowAlwaysOnTop", async (_event, flag: boolean): Promise<boolean> => {
        try {
            if (mainWindow) {
                mainWindow.setAlwaysOnTop(flag);
                return flag;
            }
        } catch (e) {
            throw e;
        }
        return !flag;
    });
    ipcMain.handle("dialog:SaveFile", async (_ev, data: string) => {
        try {
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!);
            if (!canceled && filePath.length > 0) {
                await fs.writeFile(filePath, data);
            }
        } catch (e) {
            throw e;
        }
    });

    ipcMain.handle("dialog:OpenFile", async () => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
                properties: ["openFile", "multiSelections"],
                filters: [
                    { name: "所有文件", extensions: ["pdf", "js", "jsx", "txt", "html", "htm", "css", "md", "csv", "xml", "rtf", "png", "jpeg", "jpg", "webp", "heic", "heif", "mp4", "mpeg", "mov", "avi", "flv", "mpg", "webm", "wmv", "3gpp", "wav", "mp3", "aiff", "aac", "ogg", "flac"] },
                    { name: "文档", extensions: ["pdf", "js", "jsx", "txt", "html", "htm", "css", "md", "csv", "xml", "rtf"] },
                    { name: "图片", extensions: ["png", "jpeg", "jpg", "webp", "heic", "heif"] },
                    { name: "视频", extensions: ["mp4", "mpeg", "mov", "avi", "flv", "mpg", "webm", "wmv", "3gpp"] },
                    { name: "音频", extensions: ["wav", "mp3", "aiff", "aac", "ogg", "flac"] }
                ]
            });
            if (!canceled && filePaths.length > 0) {
                return filePaths;
            }
        } catch (e) {
            console.log("openfile error:", e);
        }
        return null;
    });
}