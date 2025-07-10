import { Button } from "@renderer/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Settings } from "lucide-react"
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { Save } from "lucide-react";
import { useRef, useState } from "react";
import { SettingArea } from "@renderer/components/setting/generalSetting";
import { globalConfig } from "@renderer/lib/state/confState";
import { Config, loadConfig, newConfigDefault } from "@renderer/lib/data/config";
import { uiState } from "@renderer/lib/state/uistate";
import TrafficLight from "@renderer/components/titlebar/trafficLight";
import McpSetting from "@renderer/components/setting/mcpSetting";
import mcpSvg from "@renderer/assets/mcp.svg"
export default function SettingPage({ init }: { init?: (conf: Config) => void }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showSaveBtn, setShowSaveBtn] = useState(true);
    const settingAreaRef = useRef<any>(null);
    const config = globalConfig((state) => state.config);
    const isMac = uiState((state) => state.isMac);
    return (
        <div className="w-screen h-screen flex flex-col flex-1 bg-neutral-200/20">
            <Tabs className="w-full h-full gap-y-0" defaultValue="generalSetting" orientation="vertical" onValueChange={(s) => {
                setShowSaveBtn(s === "generalSetting");
            }}>
                <div className="titlebar flex flex-row justify-between items-center w-full">
                    <div className="flex flex-row">
                        <div className={`${isMac ? "w-20" : "w-2"}`} />
                        <Button
                            className="titlebar-return"
                            onClick={() => {
                                document.startViewTransition(() => {
                                    navigate("/");
                                })
                            }}
                        >
                            <Home color="gray" className={`${config ? "size-5" : "hidden"}`} strokeWidth={1} />
                        </Button>
                    </div>
                    <TabsList className="titlebar-tabs bg-transparent">
                        <TabsTrigger value="generalSetting" className="font-serif font-semibold data-[state=active]:bg-emerald-500/50">
                            <Settings strokeWidth={1} />{t("generalSettings")}</TabsTrigger>
                        <TabsTrigger value="mcpSetting" className="font-serif font-semibold data-[state=active]:bg-emerald-500/50">
                            <img src={mcpSvg} alt="" />
                            {t("mcpSettings")}
                        </TabsTrigger>
                    </TabsList>
                    <div className="w-20 h-full inline-flex flex-row items-center justify-end py-1 pe-2 gap-2" >
                        <Button
                            className={`nodrag text-xs h-7 w-14 gap-x-1 bg-red-400/95 hover:bg-red-600/90 ${!showSaveBtn ? "hidden" : ""}`}
                            onClick={() => {
                                if (settingAreaRef && settingAreaRef.current) {
                                    settingAreaRef.current.saveConf();
                                    if (init) {
                                        setTimeout(() => {
                                            (async () => {
                                                const conf = await loadConfig();
                                                if (conf) {
                                                    await init(conf);
                                                }
                                            })();
                                        }, 200);
                                    }
                                }
                            }}
                        >
                            <Save className="size-4" />{t("save")}
                        </Button>
                        {!isMac && <TrafficLight />}
                    </div>
                </div>
                <TabsContent value="generalSetting" className="w-full h-full flex flex-col overflow-x-hidden overflow-y-auto bg-transparent flex-1 justify-start items-start border-t border-neutral-900/20">
                    <SettingArea ref={settingAreaRef} config={config || newConfigDefault()} />
                </TabsContent>
                <TabsContent value="mcpSetting" className="border-t border-neutral-900/20">
                    <McpSetting />
                </TabsContent>
            </Tabs>
        </div>
    )
}
