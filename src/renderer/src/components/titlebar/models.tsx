import { uiState } from "@renderer/lib/state/uistate"
import { DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { getModelDisplayName, modelSimpleInfo, setModelsTagMap } from "@renderer/lib/util/model";
import { Sparkles } from "lucide-react";
import { changeModel } from "@renderer/lib/ai/gemini";
import { useTranslation } from "react-i18next";


const TagModelsList = ({ models }: { models: modelSimpleInfo[] }) => {
    const { t } = useTranslation();
    const maps = setModelsTagMap(models);
    const tags = [...Array.from(maps.keys())].sort();
    return (
        <>
            {tags.map((tag) => {
                const arr = maps.get(tag);
                if (!arr) {
                    return;
                }
                return (
                    <DropdownMenuSub key={crypto.randomUUID()}>
                        <DropdownMenuSubTrigger>{tag}</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {arr.filter((m, idx, self) => idx === self.findIndex(u => u.name === m.name)).sort().map((m) => {
                                return (
                                    <DropdownMenuRadioItem value={m.name} key={m.displayName + m.name} className="font-light text-xs" title={m.name}>
                                        {m.displayName || t("noModelSelected")}
                                    </DropdownMenuRadioItem>
                                )
                            })}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )
            })}
        </>
    )
}
export default function ChatModelsMenu() {
    const { t } = useTranslation();
    const models = uiState((state) => state.models);
    const model = uiState((state) => state.currentModel);
    const steModel = uiState((state) => state.setCurrentModel);
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild onDoubleClick={e => e.stopPropagation()}>
                    <div className="nodrag border-neutral-400/50 inline-flex flex-row items-center border rounded-sm px-1 py-1 gap-0.5">
                        <Sparkles strokeWidth={"1"} size={16} className="text-amber-600/75 me-2" />
                        <div
                            className="border-none hover:bg-transparent hover:shadow-none font-extralight text-xs text-ellipsis text-nowrap w-40 overflow-hidden break-words hover:cursor-pointer nodrag rounded-md"
                            title={models && models.length > 0 ? getModelDisplayName(model, models) : t("emptyModelList")}
                        >

                            {models && models.length > 0 ? getModelDisplayName(model, models) : t("emptyModelList")}
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="bottom"
                    className="max-h-56 max-w-48"
                    align="center">
                    <DropdownMenuRadioGroup
                        value={model}
                        onValueChange={(v) => {
                            changeModel(v);
                            steModel(v);
                        }}
                    >
                        {models && <TagModelsList models={models} />}
                    </DropdownMenuRadioGroup>

                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
