import { cmdBlur, cmdGlobalNotifyConfChanged } from "@shared/types/cmd";
import { BrowserWindow, globalShortcut, Rectangle, screen } from "electron";
import { join } from "path";
import icon from '../../resources/icon.png?asset';
import { is } from '@electron-toolkit/utils';
export let quickWindow: BrowserWindow | undefined = undefined;


export const createQuickWindow = () => {
    if (quickWindow !== undefined) {
        return;
    }
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const x = Math.floor((screenWidth - 320) - 20);
    const y = screenHeight - (process.platform === "darwin" ? 44 : 80);
    console.log("quick win pos,x:", x, "y:", y, "screenWidth:", screenWidth, "screenHeight:", screenHeight)
    quickWindow = new BrowserWindow({
        width: 320,
        height: 44,
        minWidth: 260,
        minHeight: 40,
        show: false,
        autoHideMenuBar: true,
        skipTaskbar: true,
        transparent: true,
        frame: false,
        x: x,
        y: y,
        titleBarStyle: 'default',
        center: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        alwaysOnTop: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
        }
    });

    quickWindow.on("ready-to-show", () => {
        quickWindow?.setPosition(x, y);
        quickWindow!.show();
        const { width, height } = quickWindow!.getBounds();
        quickWindow!.setBounds({
            x,
            y,
            width,
            height
        })
        quickWindow!.focus();
    });
    quickWindow.setIgnoreMouseEvents(true, {
        forward: true,
    });
    quickWindow.on("blur", () => {
        quickWindow?.webContents.send(cmdBlur);
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        quickWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/minWin.html`);
    } else {
        quickWindow.loadFile(join(__dirname, '../renderer/minWin.html'));
    }
}

let savedBounds: Rectangle | undefined = undefined;
let accelerator = "Ctrl+Alt+Space";
export const createQuickWindowWithGlobalShortCut = (naccelerator: string) => {
    if (naccelerator === accelerator && globalShortcut.isRegistered(naccelerator)) {
        return;
    }
    if (naccelerator !== accelerator && globalShortcut.isRegistered(accelerator)) {
        globalShortcut.unregister(accelerator);
    }
    accelerator = naccelerator;
    globalShortcut.register(accelerator, () => {
        if (quickWindow) {
            if (quickWindow.isVisible()) {
                const bounds = quickWindow.getBounds();
                savedBounds = bounds;
                console.log("set savedBounds:", bounds);
                quickWindow.hide();
            } else {
                quickWindow.show();
                if (savedBounds) {
                    quickWindow.setBounds(savedBounds, false);
                }
                quickWindow.focus();
            }
        } else {
            createQuickWindow();
        }
    });
}

export const destroyQuickWindow = () => {
    if (quickWindow) {
        globalShortcut.unregister("Ctrl+Shift+Space");
        quickWindow.destroy();
        quickWindow = undefined;
    }
}

export const hideQuickWindow = () => {
    if (quickWindow && quickWindow.isVisible()) {
        const bounds = quickWindow.getBounds();
        savedBounds = bounds;
        quickWindow.hide();
    }
}

export const resetQuickWindowShadow = () => {
    if (quickWindow) {
        quickWindow.setHasShadow(false);
        setTimeout(() => {
            quickWindow!.setHasShadow(true);
        }, 50);
    }
}

export const resizeQuickWindow = (size: { w: number, h: number }) => {
    if (quickWindow) {
        const { x, y, width, height } = quickWindow.getBounds();
        const newY = (y + height) - size.h;
        const newX = (x + width) - size.w;
        // console.log("reset size to:", size, "x:", x, "y:", y, "newX:", newX, "newY:", newY);
        quickWindow.hide();
        quickWindow!.setBounds({
            x: x,
            y: y,
            width: size.w,
            height: size.h
        }, false);

        setTimeout(() => {
            quickWindow!.show();
            quickWindow!.setBounds({
                x: newX,
                y: newY,
                width: size.w,
                height: size.h
            }, false);
            // const bounds = quickWindow?.getBounds();
            // console.log("window size:", bounds);
        });
    }
}

export const notifyQuickWindowConfChanged = () => {
    if (quickWindow) {
        quickWindow.webContents.send(cmdGlobalNotifyConfChanged);
    }
}
