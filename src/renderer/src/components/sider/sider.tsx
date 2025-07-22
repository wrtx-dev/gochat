import { forwardRef, Ref, useImperativeHandle, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { uiState } from "@renderer/lib/state/uistate";
import SessionItemList from "./sessionlist";
import { loadSession } from "@renderer/lib/ai/gemini";
import { useTranslation } from "react-i18next";
import { stopMcpServers } from "@renderer/lib/util/mcpIpc";
import { searchState } from "@renderer/lib/state/searchState";

const Sider = forwardRef((_: unknown, ref: Ref<unknown>) => {
    useImperativeHandle(ref, () => ({}));
    // const [hideSider, setHideSider] = useState(false);
    const hideSider = uiState((state) => state.hideSider);
    const sessionFilter = uiState((state) => state.sessionFilter);
    const setSessionFilter = uiState((state) => state.setSessionFilter);
    const [focusSearch, setFocusSearch] = useState(false);
    const currentTool = uiState(state => state.currentTool);
    const setCurrentTool = uiState(state => state.setCurrentTool);
    const resetSearch = searchState(state => state.resetSearch);
    const { t } = useTranslation();
    return (

        <div className={`flex flex-col ${hideSider ? "w-0" : "w-52"} h-full bg-neutral-200/40 transition-all duration-300 ease-in-out gap-y-4 overflow-x-hidden overflow-y-auto`}>
            <div className="w-full h-10"></div>
            <div className={`w-[92%] p-2 py-1 border border-neutral-200/80 inline-flex rounded-xl items-center justify-center mx-auto ${focusSearch ? "bg-white" : "bg-transparent"}`}>
                <Input
                    type="search"
                    className="w-full text-xs h-3.5 rounded-none focus-visible:ring-0 focus-visible:border-none shadow-none border-none px-0.5"
                    onFocus={() => { setFocusSearch(true) }}
                    onBlur={() => setFocusSearch(false)}
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                />
                <Search color="gray" className="size-3" strokeWidth={1} />
            </div>
            <SessionItemList onChangeSession={(uuid: string) => {
                (async () => {
                    if (currentTool.includes("function")) {
                        stopMcpServers();
                    }
                    setCurrentTool([]);
                    resetSearch();
                    loadSession(uuid);
                })();
            }} />
        </div>
    )
})

Sider.displayName = "SiderBar";

export const SiderBar = Sider;
