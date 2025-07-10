import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import path from "path";
import { t } from "./i18";

let tray: Tray | null = null;
let contextMenu: Menu | undefined = undefined;
let mainWin: BrowserWindow | null = null;
export const createTray = (mainWindow: BrowserWindow) => {
    if (tray != null) {
        return;
    }
    mainWin = mainWindow;
    const iconPath = app.isPackaged
        ? path.join(app.getAppPath(), "resources", "trayIcon", "icon.png")
        : path.join(__dirname, "../../resources/trayIcon", "icon.png");
    try {
        console.log("iconPath:", iconPath);
        const icon = nativeImage.createFromPath(iconPath);
        // icon.setTemplateImage(true);
        tray = new Tray(icon);
        if (tray) {
            console.log("create tray");
            tray.setToolTip("go chat");
        }
        const showOrHideWindow = () => {
            if (mainWin) {
                if (mainWin.isVisible()) {
                    if (mainWin.isFocused()) {
                        mainWin.hide();
                        if (process.platform === "darwin") {
                            app.dock?.hide();
                        } else if (process.platform === "win32") {
                            mainWin.setSkipTaskbar(true);
                        }
                    } else {
                        mainWin.focus();
                    }
                } else {
                    mainWin.show();
                    if (process.platform === "darwin") {
                        app.dock?.show();
                    } else if (process.platform === "win32") {
                        mainWin.setSkipTaskbar(false);
                    }
                }
            }
        }
        contextMenu = Menu.buildFromTemplate([
            {
                label: t("quit"),
                click: () => app.quit(),
            },
            {
                label: t("showOrHideWindow"),
                click: () => showOrHideWindow(),
            }
        ]);
        tray.on("click", () => {
            showOrHideWindow();
        });
        // tray.setContextMenu(contextMenu);
        tray.on("right-click", () => {
            tray?.popUpContextMenu(contextMenu);
        })
    } catch (e) {
        console.error("Error creating tray icon:", e);
    }
}

export const destroyTray = () => {
    if (tray) {
        tray.destroy();
        contextMenu = undefined;
        tray = null;
    }
    if (mainWin) {
        mainWin = null;
    }
}

export const changeTrayLang = () => {
    if (tray && mainWin) {
        tray.destroy();
        tray = null;
        createTray(mainWin);
    }
}