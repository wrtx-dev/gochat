import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CircleX } from "lucide-react";
import { Toggle } from "../ui/toggle";
import { searchState } from "@renderer/lib/state/searchState";
import { useEffect, useId } from "react";

export default function SearchBar() {
    const show = searchState(state => state.show);
    const setQuery = searchState(state => state.setQuery);
    const query = searchState(state => state.query);
    const searchRange = searchState(state => state.searchRange);
    const currentIndex = searchState(state => state.currentIndex);
    const resetSearch = searchState(state => state.resetSearch);
    const subCurrentIndex = searchState(state => state.subCurrentIndex);
    const addCurrentIndex = searchState(state => state.addCurrentIndex);
    const ignoreCase = searchState(state => state.ignoreCase);
    const setIgnoreCase = searchState(state => state.setIgnoreCase);
    const { t } = useTranslation();


    const id = useId();
    useEffect(() => {
        if (show) {
            document.getElementById(id)?.focus();
        }
    }, [show]);

    return (
        <div className={`flex flex-row py-1 items-center w-full h-8 px-2 gap-2 bg-neutral-200/50 ${!show && "hidden"}`}>
            <Label
                className="text-xs select-none cursor-default text-neutral-600 font-light"
            >
                {t("messageBox.searchContext")}
            </Label>
            <div
                className="flex-1 border border-neutral-300 rounded-sm bg-white inline-flex  flex-row items-center justify-start px-0.5 gap-1 transition-all duration-200"
            >
                <Input
                    className="flex-1 h-3/4 px-1 focus-visible:ring-0 focus-visible:outline-0 rounded-sm focuse-visible:shadow-none shadow-none border-none focus-visible:border-none"
                    id={id}
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                    value={query ? query : ""}
                />
                <Toggle
                    size={"sm"}
                    className="rounded-sm size-5 select-none text-xs font-light"
                    pressed={!ignoreCase}
                    onPressedChange={() => {
                        setIgnoreCase(!ignoreCase);
                    }}
                >
                    {"Ab"}
                </Toggle>
                {query && query.length > 0 && <Button
                    variant="ghost"
                    size={"sm"}
                    className="rounded-full size-4 text-xs"
                    onClick={() => {
                        setQuery(undefined)
                    }}
                >
                    <CircleX className="size-4" strokeWidth={1} />
                </Button>}
            </div>
            {searchRange !== undefined && <Label
                className="text-xs select-none cursor-default text-neutral-600 font-light"
            >
                {`${currentIndex + 1}/${searchRange?.length}`}
            </Label>}
            <Button
                variant="outline"
                className="rounded-sm px-0.5 h-6 text-xs"
                disabled={searchRange === undefined || searchRange.length === 0}
                onClick={() => {
                    subCurrentIndex();
                }}
            >
                {t("messageBox.prev")}
            </Button>
            <Button
                variant="outline"
                className="rounded-sm px-0.5 h-6 text-xs"
                disabled={searchRange === undefined || searchRange.length === 0}
                onClick={() => {
                    addCurrentIndex();
                }}
            >
                {t("messageBox.next")}
            </Button>
            <Button
                variant="ghost"
                size={"sm"}
                className="rounded-full size-4 text-xs"
                onClick={() => {
                    resetSearch();
                }}
            >
                <CircleX className="size-4" strokeWidth={1} />
            </Button>
        </div>
    )
}
