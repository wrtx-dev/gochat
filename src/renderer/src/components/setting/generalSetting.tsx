
import { Config, historySessionModeltoString, historySessionModel, saveConfig, safteyLevelToStr, EnumMessageSendKeyToString, EnumMessageSendKey, } from "@renderer/lib/data/config";
import { globalConfig } from "@renderer/lib/state/confState";
import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { getModels, getModelsList, saveModelsList } from "@renderer/lib/util/model";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";
import { Button } from "../ui/button";
import { modelSimpleInfo } from "@renderer/lib/util/model";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { useTranslation } from "react-i18next";
import i18n, { langMaps } from "@renderer/locales/i18n";
import { updateConf } from "@renderer/lib/ai/gemini";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Info } from "lucide-react";
import { Label } from "@radix-ui/react-dropdown-menu";
import { changeAppLang, createAppTray, createQuickWindow, destroyQuickWindow, destroyTray, notifyConfChanged } from "@renderer/lib/util/misc";
import { changeLanguage } from "i18next";
import { EnumQuickWinHotKey, EnumQuickWinHotKeyToString } from "@shared/types/config";

const GeneralSetting = forwardRef(({ config }: { config: Config }, ref: Ref<any>) => {
    const setGlobalConfig = globalConfig((state) => state.setConfig);
    const [conf, setConf] = useState<Config>({
        ...config,
        disableThought: config.disableThought ?? false,
        showThought: config.showThought ?? false,
        autoGenSessionName: config.autoGenSessionName ?? false
    });
    const [models, setModels] = useState<modelSimpleInfo[] | null>(null);
    // const [defaultModel, setDefaultModel] = useState(conf.defaultModel);
    const { t } = useTranslation();
    useImperativeHandle(ref, () => (
        {
            saveConf: () => {
                setGlobalConfig({ ...conf });
                (async () => {
                    await saveConfig({ ...conf });
                    notifyConfChanged();
                })();
                updateConf({ ...conf });
                if (conf.showTray) {
                    createAppTray();
                } else {
                    destroyTray();
                }
                if (conf.createQuickWindow) {
                    createQuickWindow(conf.quickWinHotkey);
                } else {
                    destroyQuickWindow();
                }
                changeAppLang(conf.lang);
                changeLanguage(conf.lang);
            }
        }
    ));

    const refleshModels = async () => {
        if (conf.apikey !== "") {
            const modelList = await getModels(conf);
            setModels(modelList);
            if (modelList.length > 0) {
                saveModelsList(modelList);
            }
        }
    };
    useEffect(() => {
        (async () => {
            const m = await getModelsList();
            if (m && m.length > 0) {
                setModels(m);
            }
        })();
    }, []);
    return (
        <div className="flex flex-col justify-start items-start w-full h-full p-2 font-serif text-sx gap-y-1.5 overflow-y-auto">

            <div className="flex flex-col w-full py-2">
                <span className="text-xs font-light text-neutral-500/70">
                    {t("generalSettings")}
                </span>
                <Separator />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">语言/language</span>
                <Select value={conf.lang.length > 0 ? conf.lang : i18n.language}
                    onValueChange={(v) => {
                        (async () => {
                            await i18n.changeLanguage(v);
                            setConf(prev => ({
                                ...prev,
                                lang: v,
                            }));
                            await changeAppLang(v);
                        })();
                    }
                    }>
                    <SelectTrigger className="col-span-5 w-1/3 focus-visible:ring-0 select-none">
                        <SelectValue placeholder="语言/lang" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                        {langMaps && Array.from(langMaps.entries()).map(([key, value]) => {
                            return (
                                <SelectItem
                                    className="cursor-default"
                                    value={key}
                                    key={key}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {value}
                                    </span>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("apiKey")}</span>
                <Input className="col-span-6 input-comm"
                    value={conf.apikey}
                    onChange={(e) => setConf((prev) => ({
                        ...prev,
                        apikey: e.target.value
                    }))}
                    onBlur={() => {
                        if (!models || models.length === 0) {
                            refleshModels();
                        }
                    }}
                />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("provider")}</span>
                <Input className="col-span-6 input-comm" value={conf.provider || ""} onChange={(e) => setConf((prev) => ({
                    ...prev,
                    provider: e.target.value
                }))} />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("endpoint")}</span>
                <Input className="col-span-6 input-comm" value={conf.endPoint || ""} onChange={(e) => setConf((prev) => ({
                    ...prev,
                    endPoint: e.target.value
                }))} />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("roleSettings")}</span>
                <Textarea className="col-span-6 textarea-comm" value={conf.systemInstruction} onChange={(e) => setConf((prev) => ({
                    ...prev,
                    systemInstruction: e.target.value
                }))} />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("defaultModel")}</span>
                <div className="col-span-6 inline-grid grid-cols-6 gap-1.5">
                    <Select value={conf.defaultModel} onValueChange={(v) => setConf((state) => ({ ...state, defaultModel: v }))}>
                        <SelectTrigger className="col-span-5 w-full focus-visible:ring-0 select-none" disabled={models === null}>
                            <SelectValue placeholder={t("selectModel")} />
                        </SelectTrigger>
                        <SelectContent>
                            {models && models.map((v) => {
                                return (
                                    <SelectItem className="cursor-default" value={v.name} key={v.name}>{v.displayName}</SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        disabled={conf.apikey.length === 0}
                        size="sm"
                        onClick={() => {
                            console.log("reflesh models");
                            refleshModels();
                        }}
                        className={` ${conf.lang !== "zh-CN" && "text-xs whitespace-normal break-words"}`}
                    >
                        {t("refreshModelList")}
                    </Button>
                </div>
            </div>
            <div className="setting-item-row gap-3">
                <div className="col-span-4 w-full grid grid-cols-4 items-center">
                    <span className="col-span-2 w-full text-sm select-none cursor-default">{t("historySessionModel")}</span>
                    <Select value={conf.sessionLoadModel.toString()} onValueChange={(v) => setConf((state) => ({ ...state, sessionLoadModel: parseInt(v) }))}>
                        <SelectTrigger className="col-span-2 w-full mx-1 focus-visible:ring-0 select-none">
                            <SelectValue placeholder={t("selectHistoryModel")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem className="cursor-default" value={historySessionModel.currentModel.toString()}>
                                {t(`general.${historySessionModeltoString(historySessionModel.currentModel)}`)}
                            </SelectItem>
                            <SelectItem className="cursor-default" value={historySessionModel.defaultModel.toString()}>
                                {t(`general.${historySessionModeltoString(historySessionModel.defaultModel)}`)}
                            </SelectItem>
                            <SelectItem className="cursor-default" value={historySessionModel.recordedModel.toString()}>
                                {t(`general.${historySessionModeltoString(historySessionModel.recordedModel)}`)}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-4 w-full grid grid-cols-4 items-center">
                    <span className="col-span-1 w-full text-sm select-none cursor-default">{t("newSessionModel")}</span>
                    <Select value={conf.newSessionModelUseDefault.toString()} onValueChange={(v) => setConf((state) => ({ ...state, newSessionModelUseDefault: v.toLocaleLowerCase() === "true" }))}>
                        <SelectTrigger className="col-span-2 w-full mx-1 focus-visible:ring-0 select-none">
                            <SelectValue placeholder={t("selectNewSessionModel")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem className="cursor-default" value={"true"}>
                                {t("general.default")}
                            </SelectItem>
                            <SelectItem className="cursor-default" value={"false"}>
                                {t("general.current")}
                            </SelectItem>

                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="w-full inline-flex gap-2 items-center">
                <Checkbox checked={conf.autoGenSessionName} onCheckedChange={(v) => setConf((state) => ({ ...state, autoGenSessionName: v as boolean }))} />
                <span className="text-sm">{t("autoGenerateTitle")}</span>
                <Select value={conf.genSessionNameAfter.toString()} onValueChange={(v) => setConf((prev) => ({ ...prev, genSessionNameAfter: parseInt(v) }))} disabled={!conf.autoGenSessionName}>
                    <SelectTrigger className="text-sm focus-visible:ring-0 select-none">
                        <SelectValue placeholder={t("select")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem className="cursor-default" value={"1"}>1</SelectItem>
                        <SelectItem className="cursor-default" value={"2"}>2</SelectItem>
                        <SelectItem className="cursor-default" value={"3"}>3</SelectItem>
                        <SelectItem className="cursor-default" value={"4"}>4</SelectItem>
                        <SelectItem className="cursor-default" value={"5"}>5</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm">{t("roundsAfter")}</span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("general.namedSessionModel")}</span>
                <Select value={conf.namedSessionModel} onValueChange={(v) => setConf((state) => ({ ...state, namedSessionModel: v }))}>
                    <SelectTrigger className="col-span-5 w-full focus-visible:ring-0 select-none" disabled={models === null}>
                        <SelectValue placeholder={t("selectModel")} />
                    </SelectTrigger>
                    <SelectContent>
                        {models && models.map((v) => {
                            return (
                                <SelectItem className="cursor-default" value={v.name} key={v.name}>{v.displayName}</SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("maxOutputTokens")}</span>
                <Input className="col-span-1 input-comm text-sm font-mono" value={conf.maxOutputToken} onChange={(e) => setConf((prev) => ({ ...prev, maxOutputToken: parseInt(e.target.value) }))} />
            </div>
            <div className="w-full inline-flex gap-2 items-center">
                <Checkbox checked={conf.createQuickWindow} onCheckedChange={(v) => setConf((state) => ({ ...state, createQuickWindow: v as boolean }))} />
                <span className="text-sm select-none cursor-default">{t("general.createQuickWindow")}</span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("general.showQuickWin")}</span>
                <Select value={conf.quickWinHotkey.toString()} onValueChange={(v) => setConf((state) => ({ ...state, quickWinHotkey: parseInt(v) as EnumQuickWinHotKey }))}>
                    <SelectTrigger className="col-span-2 w-full focus-visible:ring-0 select-none">
                        <SelectValue placeholder={EnumQuickWinHotKeyToString(conf.quickWinHotkey)} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem className="cursor-default" value={EnumQuickWinHotKey.CtrlAltSpace.toString()}>{EnumQuickWinHotKeyToString(EnumQuickWinHotKey.CtrlAltSpace)}</SelectItem>
                        <SelectItem className="cursor-default" value={EnumQuickWinHotKey.CtrlShiftSpace.toString()}>{EnumQuickWinHotKeyToString(EnumQuickWinHotKey.CtrlShiftSpace)}</SelectItem>
                        <SelectItem className="cursor-default" value={EnumQuickWinHotKey.AltSpace.toString()}>{EnumQuickWinHotKeyToString(EnumQuickWinHotKey.AltSpace)}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full inline-flex gap-2 items-center">
                <Checkbox checked={conf.showTray} onCheckedChange={(v) => setConf((state) => ({ ...state, showTray: v as boolean }))} />
                <span className="text-sm select-none cursor-default">{t("general.createTray")}</span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("general.messageSendKey")}</span>
                <Select value={conf.sendKey.toString()} onValueChange={(v) => setConf((state) => ({ ...state, sendKey: parseInt(v) as EnumMessageSendKey }))}>
                    <SelectTrigger className="col-span-2 w-full focus-visible:ring-0 select-none">
                        <SelectValue placeholder={EnumMessageSendKeyToString(conf.sendKey)} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem className="cursor-default" value={EnumMessageSendKey.Enter.toString()}>{EnumMessageSendKeyToString(EnumMessageSendKey.Enter)}</SelectItem>
                        <SelectItem className="cursor-default" value={EnumMessageSendKey.CtrlEnter.toString()}>{EnumMessageSendKeyToString(EnumMessageSendKey.CtrlEnter)}</SelectItem>
                        <SelectItem className="cursor-default" value={EnumMessageSendKey.AltEnter.toString()}>{EnumMessageSendKeyToString(EnumMessageSendKey.AltEnter)}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col w-full py-2">
                <span className="text-xs font-light text-neutral-500/70">
                    {t("general.thoughtSetting")}
                </span>
                <Separator />
            </div>
            <div className="setting-item-row">
                <div className="setting-item-label gap-1.5">
                    <Checkbox checked={conf.disableThought} onCheckedChange={(v) => setConf((state) => ({ ...state, disableThought: v as boolean }))} />
                    <span className="text-sm">{t("general.disableThought")}</span>
                    <HoverCard openDelay={300}>
                        <HoverCardTrigger asChild>
                            <span className="inline-flex flex-row items-center justify-center size-4">
                                <Info strokeWidth={1} />
                            </span>
                        </HoverCardTrigger>
                        <HoverCardContent side="right">
                            <span className="text-xs font-extralight cursor-default select-none">
                                {t("general.thoughtNotice")}
                            </span>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </div>
            <div className="setting-item-row">
                <div className="setting-item-label gap-1.5">
                    <Checkbox
                        checked={conf.showThought}
                        onCheckedChange={(v) => setConf((state) => ({ ...state, showThought: v as boolean }))}
                        disabled={conf.disableThought}
                    />
                    <span className="text-sm">{t("showThought")}</span>
                </div>
            </div>
            <div className="setting-item-row">
                <div className="setting-item-label gap-1.5">
                    <Checkbox
                        checked={conf.dynThought || false}
                        onCheckedChange={(v) => setConf((state) => ({ ...state, dynThought: v as boolean }))}
                        disabled={conf.disableThought}
                    />
                    <span className="text-sm">{t("general.dynThought")}</span>
                </div>
            </div>
            <div className="setting-item-row">
                <Label className="setting-item-label gap-1.5">
                    {t("general.thoughtCost")}
                    <HoverCard openDelay={300}>
                        <HoverCardTrigger asChild>
                            <span className="inline-flex flex-row items-center justify-center size-4">
                                <Info strokeWidth={1} />
                            </span>
                        </HoverCardTrigger>
                        <HoverCardContent side="right">
                            <span className="text-xs font-extralight select-none cursor-default">
                                {t("general.thoughtCostInfo")}
                            </span>
                        </HoverCardContent>
                    </HoverCard>
                </Label>
                <Input className="w-16 h-6 input-comm" disabled={conf.disableThought === true || conf.dynThought === true} value={conf.thoughtCoast === undefined ? 0 : conf.thoughtCoast} onChange={(e) => setConf((prev) => ({
                    ...prev,
                    thoughtCoast: e.target.value.length > 0 ? parseInt(e.target.value) : undefined,
                }))} />

            </div>
            <div className="flex flex-col w-full py-2">
                <span className="text-xs font-light text-neutral-500/70">
                    {t("parameterSettings")}
                </span>
                <Separator />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">
                    {t("temperature")}
                </span>
                <Slider className="col-span-5" step={0.05} max={2} value={[conf.temprature]} onValueChange={(v) => setConf((state) => ({ ...state, temprature: v[0] }))} />
                <Input className="input-comm col-span-1" type="number" value={conf.temprature} onChange={e => setConf((state) => ({ ...state, temprature: parseFloat(e.target.value) }))} step={0.05} max={2} min={0} />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">
                    {t("topP")}
                </span>
                <Slider className="col-span-5" step={0.05} max={1} value={[conf.topP]} onValueChange={(v) => setConf((state) => ({ ...state, topP: v[0] }))} />
                <Input className="input-comm col-span-1" type="number" value={conf.topP} onChange={e => setConf((state) => ({ ...state, topP: parseFloat(e.target.value) }))} step={0.05} max={1} min={0} />
            </div>
            <div className="flex flex-col w-full py-2">
                <span className="text-xs font-light text-neutral-500/70">
                    {t("safetySettings")}
                </span>
                <Separator />
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("harassment")}</span>
                <Slider className="col-span-5" step={1} max={5} value={[conf.Harassment]} onValueChange={v => setConf((state) => ({ ...state, Harassment: v[0] }))} />
                <span className="text-xs font-light inline-flex items-center ps-2">
                    {safteyLevelToStr(conf.Harassment)}
                </span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("hateSpeech")}</span>
                <Slider className="col-span-5" step={1} max={5} value={[conf.HateSpeech]} onValueChange={v => setConf((state) => ({ ...state, HateSpeech: v[0] }))} />
                <span className="text-xs font-light inline-flex items-center ps-2">
                    {safteyLevelToStr(conf.HateSpeech)}
                </span>
            </div>

            <div className="setting-item-row">
                <span className="setting-item-label">{t("sexuallyExplicit")}</span>
                <Slider className="col-span-5" step={1} max={5} value={[conf.SexuallyExplicit]} onValueChange={v => setConf((state) => ({ ...state, SexuallyExplicit: v[0] }))} />
                <span className="text-xs font-light inline-flex items-center ps-2">
                    {safteyLevelToStr(conf.SexuallyExplicit)}
                </span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("dangerousContent")}</span>
                <Slider className="col-span-5" step={1} max={5} value={[conf.Dangerous]} onValueChange={v => setConf((state) => ({ ...state, Dangerous: v[0] }))} />
                <span className="text-xs font-light inline-flex items-center ps-2">
                    {safteyLevelToStr(conf.Dangerous)}
                </span>
            </div>
            <div className="setting-item-row">
                <span className="setting-item-label">{t("civicIntegrity")}</span>
                <Slider className="col-span-5" step={1} max={5} value={[conf.CivicIntegrity]} onValueChange={v => setConf((state) => ({ ...state, CivicIntegrity: v[0] }))} />
                <span className="text-xs font-light inline-flex items-center ps-2">
                    {safteyLevelToStr(conf.CivicIntegrity)}
                </span>
            </div>
        </div >
    )
});

GeneralSetting.displayName = "SettingArea";

export const SettingArea = GeneralSetting;
