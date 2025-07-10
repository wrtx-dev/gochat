import { closeWin, maxWin, minWin } from "@renderer/lib/util/misc";
import { Button } from "../ui/button";
import { Minus, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function TrafficLight() {
    const { t } = useTranslation();
    return (
        <div className="inline-flex flex-row-reverse gap-2 w-20 items-center h-full bg-transparent" >
            <Button
                variant={"ghost"}
                size={"icon"}
                className="w-4 h-4 rounded-full bg-red-500/55 hover:bg-red-500 nodrag"
                onClick={() => closeWin()}
                title={t("closeWindow")}
            >
                <X strokeWidth={1.5} className="size-3 text-white" />
            </Button>
            <Button
                variant={"ghost"}
                size={"icon"}
                className="w-4 h-4 rounded-full bg-yellow-500/55 hover:bg-yellow-500 nodrag"
                onClick={() => minWin()}
                title={t("minimizeWindow")}
            >
                <Minus strokeWidth={2} className="size-3 text-white" />
            </Button>
            <Button
                variant={"ghost"}
                size={"icon"}
                className="w-4 h-4 rounded-full bg-green-500/55 hover:bg-green-500 nodrag"
                onClick={() => maxWin()}
                title={t("maximizeWindow")}
            >
                <Square strokeWidth={1.5} className="size-3  text-white" />
            </Button>
        </div>
    )
}
