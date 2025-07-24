import { is } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron"
import { join } from "path";



export let liveWindow: BrowserWindow | undefined = undefined;
const createLiveWindow = () => {
    if (liveWindow !== undefined) {
        return;
    }
    liveWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight: 600,
        minWidth: 800,
        show: false,
        autoHideMenuBar: true,
        frame: process.platform === "darwin",
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
        }
    });
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        liveWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/live.html`);
    } else {
        liveWindow.loadFile(join(__dirname, '../renderer/live.html'));
    }
    liveWindow.on("closed", () => {
        liveWindow = undefined;
    });
}

export const showLiveWindow = () => {
    if (liveWindow === undefined) {
        createLiveWindow();
    }
    liveWindow!.show();
    liveWindow!.focus();
}

