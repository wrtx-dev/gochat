import { HashRouter as Router, Routes, Route } from "react-router-dom"
import ChatPage from './page/ChatPage';
import SettingPage from "./page/Setting";
import { Config } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";
import { useEffect } from "react";
import { geminiInit, registerSetCurrentSessionID, registerSetCurrentSession, registerSetCurrentModel, registerAbortMessage, registerDeleteAbortMessage } from "./lib/ai/gemini";
import { getAllMcpServers, getAllSessions } from "./lib/data/db";
import { uiState } from "./lib/state/uistate";
import { getModelsList } from "./lib/util/model";
import { session } from "@shared/types/session";
import { createAppTray, createQuickWindow, getSystemLanguage, isMacOS } from "./lib/util/misc";
import i18n from "@renderer/locales/i18n";
import { mcpServersState } from "./lib/state/mcpState";
import { Toaster } from "react-hot-toast";
import { MessageCancelFn } from "@shared/types/message";

function App({ config }: { config: Config | null }) {
  const conf = globalConfig((state) => state.config);
  const setConfig = globalConfig((state) => state.setConfig);
  const setSessions = uiState((state) => state.setSessions);
  const setCurrentSessionID = uiState((state) => state.setCurrentSessionID);
  const setCurrentSession = uiState((state) => state.setCurrentSession);
  const setPrompt = uiState((state) => state.setPrompt);
  const setModels = uiState((state) => state.setModels);
  const setModel = uiState((state) => state.setCurrentModel);
  const setIsMac = uiState((state) => state.setIsMac);
  const setCurrentModel = uiState((state) => state.setCurrentModel);
  const setMcpServers = mcpServersState((state) => state.setMcpServers);
  const addMessageCancel = uiState(state => state.addMessageCancel);
  const deleteMessageCancel = uiState(state => state.deleteMessageCancel);
  const init = async (conf: Config) => {
    setModel(conf.defaultModel);
    geminiInit(conf);
    registerSetCurrentSessionID(setCurrentSessionID);
    registerSetCurrentSession((s: session | null) => {
      setCurrentSession(s);
      if (s) {
        setPrompt(s.instruction)
      }
    });
    registerSetCurrentModel(setCurrentModel);
    registerAbortMessage((key: string, ca: MessageCancelFn) => {
      addMessageCancel(key, ca);
    });
    registerDeleteAbortMessage((key: string) => {
      deleteMessageCancel(key);
    })
    setPrompt(conf.systemInstruction || "你是有用的助手");
    await (async () => {
      const sessions = await getAllSessions();
      setSessions(sessions);
      const models = await getModelsList();
      setModels(models ? models.filter((v) => v.name.indexOf("tts") < 0 && v.name.indexOf("audio") < 0) : null);
    })();
    if (conf.showTray) {
      createAppTray();
    }
    if (conf.createQuickWindow) {
      createQuickWindow(conf.quickWinHotkey);
    }
  }
  useEffect(() => {
    setConfig(config);
    (async () => {

      const isMac = await isMacOS();
      setIsMac(isMac);
      // const conf = await loadConfig();
      const mcpServers = await getAllMcpServers();
      setMcpServers(mcpServers);
      const lang = config && config.lang.length > 0 ? config.lang : await getSystemLanguage();
      // console.log("system lang:", lang);
      await i18n.changeLanguage(lang);

      if (config && config.apikey !== "") {
        await init(config);
      }
    })();
    let lastUpdateTime = -1;
    const intval = setInterval(async () => {
      const now = new Date();
      const nowMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
      const timestamp = Math.floor(nowMin.getTime() / 1000);
      if (timestamp > lastUpdateTime) {
        lastUpdateTime = timestamp;
        const sessions = await getAllSessions();
        if (sessions.length > 0) {
          setSessions(sessions);
        }
      }
    }, 1000 * 25);
    return () => {
      clearInterval(intval);
    }
  }, []);
  return (
    <>
      <Router>
        <Routes>
          {conf === null ?
            <Route path="/" element={<SettingPage init={init} />} />
            : <>
              <Route path="/" element={<ChatPage />} />
              <Route path="/setting" element={<SettingPage />} />
            </>}
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </>
  )
}

export default App
