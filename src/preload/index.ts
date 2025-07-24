import { contextBridge, ipcRenderer, shell, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { cmdListMcpTools, cmdRunMcpTool, cmdStartMcpServer, cmdStartMcpServers, cmdStopMcpServer, cmdStopMcpServers, mcpServerInfo } from '@shared/types/mcp';
import { FunctionCall } from '@google/genai';
import { cmdBlur, cmdChangeAppLang, cmdCreateAppTray, cmdCreateQuickWindow, cmdDestroyAppTray, cmdDestroyQuickWindow, cmdGlobalNotifyConfChanged, cmdHideQuickWin, cmdOpenLiveWindow, cmdRecalcShadow, cmdResizeWindow, cmdSaveImage, cmdScreenShot, cmdScreenShotResponse, cmdSetQuickWinIgnoreMouse } from '@shared/types/cmd';
import { EnumQuickWinHotKey } from '@shared/types/config';

// Custom APIs for renderer
const api = {
  openFile: () => ipcRenderer.invoke("dialog:OpenFile"),
  statFile: (filepath: string) => ipcRenderer.invoke("GetFileInfo", filepath),
  readFile: (filepath: string) => ipcRenderer.invoke("readFile", filepath),
  chatWindowAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke("ChatWindowAlwaysOnTop", flag),
  getSystemLanguage: () => ipcRenderer.invoke("GetSystemLanguage"),
  openLink: (url: string) => shell.openExternal(url),
  isMacOS: () => ipcRenderer.invoke("checkIsMacOS"),
  maxWinSize: () => ipcRenderer.send("maximize-window"),
  closeWin: () => ipcRenderer.send("close-window"),
  minWinSize: () => ipcRenderer.send("minimize-window"),
  filePath: (file: File) => getFilePath(file),
  startMcpServers: (servers: mcpServerInfo[]) => ipcRenderer.invoke(cmdStartMcpServers, servers),
  stopMcpServers: () => ipcRenderer.invoke(cmdStopMcpServers),
  listMcpTools: () => ipcRenderer.invoke(cmdListMcpTools),
  runMcpTool: (args: FunctionCall) => ipcRenderer.invoke(cmdRunMcpTool, args),
  startMcpServer: (server: mcpServerInfo) => ipcRenderer.invoke(cmdStartMcpServer, server),
  stopMcpServer: (server: mcpServerInfo) => ipcRenderer.invoke(cmdStopMcpServer, server),
  saveFile: (data: string) => ipcRenderer.invoke("dialog:SaveFile", data),
  saveImage: (url: string) => ipcRenderer.invoke(cmdSaveImage, url),
  notifyConfChanged: () => ipcRenderer.send(cmdGlobalNotifyConfChanged),
  createQuickWindow: (hotkey: EnumQuickWinHotKey) => ipcRenderer.send(cmdCreateQuickWindow, hotkey),
  destroyQuickWindow: () => ipcRenderer.send(cmdDestroyQuickWindow),
  createAppTray: () => ipcRenderer.send(cmdCreateAppTray),
  destroyTray: () => ipcRenderer.send(cmdDestroyAppTray),
  changeLang: (lang: string) => ipcRenderer.invoke(cmdChangeAppLang, lang),
  startScrenShot: () => ipcRenderer.send(cmdScreenShot),
  screenShotCallback: (callback: (data: string) => void) => ipcRenderer.on(cmdScreenShotResponse, (_event, data: string) => {
    callback(data);
  }),
  openLiveWindow: () => ipcRenderer.send(cmdOpenLiveWindow),
}

const quickApi = {
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send(cmdSetQuickWinIgnoreMouse, ignore),
  hideWindow: () => ipcRenderer.send(cmdHideQuickWin),
  recalcShadow: () => ipcRenderer.send(cmdRecalcShadow),
  resetSize: (size: { w: number, h: number }) => ipcRenderer.send(cmdResizeWindow, size),
  onConfChanged: (callback: () => void) => ipcRenderer.on(cmdGlobalNotifyConfChanged, () => callback()),
  onWindowBlur: (callback: () => void) => ipcRenderer.on(cmdBlur, () => callback()),
}

const getFilePath = (file: File) => {
  return webUtils.getPathForFile(file);
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('quick', quickApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.quick = quickApi
}
