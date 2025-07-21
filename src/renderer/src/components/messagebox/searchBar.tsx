import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Regex, CaseUpper, CircleX } from "lucide-react";
import { Toggle } from "../ui/toggle";
import { searchState } from "@renderer/lib/state/searchState";

export default function SearchBar() {
    const show = searchState(state => state.show);
    const setShow = searchState(state => state.setShow);
    const setQuery = searchState(state => state.setQuery);
    const query = searchState(state => state.query);
    const { t } = useTranslation();
    return (
        <div className={`flex flex-row py-1 items-center w-full h-8 px-2 gap-2 bg-neutral-200/50 ${!show && "hidden"}`}>
            <Label
                className="text-xs select-none cursor-default text-neutral-600 font-light"
            >
                {t("messageBox.searchContext")}
            </Label>
            <div
                className="flex-1 border border-neutral-300 rounded-sm bg-white inline-flex  flex-row items-center justify-start px-0.5 gap-1"
            >
                <Input
                    className="flex-1 h-3/4 px-1 focus-visible:ring-0 focus-visible:outline-0 rounded-sm focuse-visible:shadow-none shadow-none border-none focus-visible:border-none"
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                    value={query ? query : ""}
                />
                <Toggle size="sm" className="rounded-sm w-3 h-5" >
                    <Regex className="size-4" strokeWidth={1} />
                </Toggle>
                <Toggle size={"sm"} className="rounded-sm w-3 h-5">
                    <CaseUpper className="size-4" strokeWidth={1} />
                </Toggle>
            </div>
            <Button variant="outline" className="rounded-sm px-0.5 h-6 text-xs">
                {t("messageBox.prev")}
            </Button>
            <Button variant="outline" className="rounded-sm px-0.5 h-6 text-xs">
                {t("messageBox.next")}
            </Button>
            <Button
                variant="ghost"
                size={"sm"}
                className="rounded-full size-4 text-xs"
                onClick={() => {
                    setShow(false);
                    setQuery(undefined);
                }}
            >
                <CircleX className="size-4" strokeWidth={1} />
            </Button>
        </div>
    )
}
