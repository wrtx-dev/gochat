import { ElectronAPI } from '@electron-toolkit/preload'
import { FunctionDeclaration } from '@google/genai';
import { cmdStopMcpServers, mcpServerInfo } from '@shared/types/mcp';
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFile: () => Promise<string[]>,
      statFile: (filepath: string) => Promise<any>,
      readFile: (filepath: string) => Promise<any>,
      chatWindowAlwaysOnTop: (flag: boolean) => Promise<any>,
      getSystemLanguage: () => Promise<any>,
      openLink: (url: string) => Promise<any>,
      isMacOS: () => Promise<boolean>,
      maxWinSize: () => void,
      closeWin: () => void,
      minWinSize: () => void,
      filePath: (file: File) => string,
      startMcpServers: (servers: mcpServerInfo[]) => Promise<any>,
      stopMcpServers: () => Promise<void>,
      listMcpTools: () => Promise<FunctionDeclaration[]>,
      runMcpTool: (args: FunctionCall) => Promise<any>,
      startMcpServer: (server: mcpServerInfo) => Promise<boolean>,
      stopMcpServer: (server: mcpServerInfo) => Promise<void>,
      saveFile: (data: string) => Promise<void>,
      saveImage: (url: string) => Promise<{ success: boolean, message: string }>,
      notifyConfChanged: () => void,
      createQuickWindow: (hotkey: EnumQuickWinHotKey) => void,
      destroyQuickWindow: () => void,
      createAppTray: () => void,
      destroyTray: () => void,
      changeLang: (lang: string) => Promise<void>,
      startScrenShot: () => void,
      screenShotCallback: (callback: (data: string) => void) => unknown,
    }
    quick: {
      setIgnoreMouse: (ignore: boolean) => void,
      hideWindow: () => void,
      recalcShadow: () => void,
      resetSize: (size: { w: number, h: number }) => void,
      onConfChanged: (callback: () => void) => unknown,
      onWindowBlur: (callback: () => void) => unknown,
    }
  }
}
