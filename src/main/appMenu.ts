import { app, Menu } from "electron";
import { t } from "./i18"
import { shell } from "electron";

let menu: Menu | undefined = undefined;
export function setupApplicationMenu() {
    if (menu) {
        return;
    }
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: t("edit"),
            submenu: [
                { label: t("copy"), role: "copy" as const },
                { label: t("paste"), role: "paste" as const },
                { label: t("cut"), role: "cut" },
                { label: t("selectAll"), role: "selectAll" as const },
                { label: t("undo"), role: "undo" as const }
            ]
        },
        {
            label: t("view"),
            submenu: [
                { label: t("reload"), role: 'reload' as const }, // 重新加载
                { label: t("forceReload"), role: 'forceReload' as const }, // 强制重新加载
                { label: t("toggleDevTools"), role: 'toggleDevTools' as const }, // 切换开发者工具
                { type: 'separator' as const },
                { label: t("actualSize"), role: 'resetZoom' as const }, // 实际大小
                { label: t("zoomIn"), role: 'zoomIn' as const }, // 放大
                { label: t("zoomOut"), role: 'zoomOut' as const }, // 缩小
                { type: 'separator' as const },
                { label: t("toggleFullscreen"), role: 'togglefullscreen' as const }
            ]
        },
        {
            label: t("app.help"), // 在 macOS 上会变成 "Help"
            submenu: [
                {
                    label: t("app.learnMore"),
                    click: async () => {
                        await shell.openExternal('https://www.electronjs.org');
                    }
                },
                { type: 'separator' as const },
                {
                    label: t("app.about"),
                    role: "about"
                }
            ]
        }
    ];
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name, // 默认会使用 package.json 中的 name
            submenu: [
                { label: t("app.about"), role: 'about' }, // 关于 [应用名称]
                { type: 'separator' },
                { label: t("app.services"), role: 'services' }, // 服务
                { type: 'separator' },
                { label: t("app.hide"), role: 'hide' }, // 隐藏 [应用名称]
                { label: t("app.hideOthers"), role: 'hideOthers' }, // 隐藏其他
                { label: t("app.unhide"), role: 'unhide' }, // 显示全部
                { type: 'separator' },
                { label: t("app.quit"), role: 'quit' } // 退出 [应用名称]
            ]
        });
    }
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

export function deleteAppicationMenu() {
    if (menu) {
        Menu.setApplicationMenu(null);
        menu = undefined;
    }
}