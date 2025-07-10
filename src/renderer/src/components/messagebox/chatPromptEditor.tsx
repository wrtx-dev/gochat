import { updateSystemInstruction } from "@renderer/lib/ai/gemini";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { uiState } from "@renderer/lib/state/uistate";
import { useTranslation } from "react-i18next";

export default function ChatPromptEditor() {
    const { t } = useTranslation();
    const showPromptEditor = uiState((state) => state.showPromptEditor);
    const setShowPromptEditor = uiState((state) => state.setShowPromptEditor);
    const currentSession = uiState((state) => state.currentSession);
    const prompt = uiState((state) => state.prompt);
    const setPrompt = uiState((state) => state.setPrompt);
    const transPromptEditor = uiState((state) => state.transPromptEditor);
    const setTransPromptEditor = uiState((state) => state.setTransPromptEditor);
    return (
        <div className={`flex flex-col w-full max-h-2/5 justify-start items-start bg-transparent transition-all ${transPromptEditor ? "opacity-0" : "opacity-100"} duration-300 ${showPromptEditor ? "border-b p-1 border-gray-100" : "h-0"}`}>
            <span className={`select-none pointer-events-none cursor-default cursor-not-drop text-xs font-mono ${!showPromptEditor && "hidden"}`}>{t("prompt")}:</span>
            <Textarea className={`w-full px-1 resize-none  border caret-gray-400 bg-gray-50  rounded-sm shadow-none opacity-100 transition-all duration-300 focus-visible:ring-0 ${!showPromptEditor && "hidden"}`} value={prompt} onChange={e => setPrompt(e.target.value)} />
            <div className={`flex flex-row-reverse w-full mt-2 px-1 gap-2 ${!showPromptEditor && "hidden"}`}>
                <Button
                    className="text-xs h-6 w-12 rounded-sm"
                    size={"sm"}
                    variant={"default"}
                    onClick={() => {
                        setTransPromptEditor(!transPromptEditor);
                        setTimeout(() => {
                            setShowPromptEditor(false);
                        }, 300);
                    }}>{t("cancel")}</Button>
                <Button
                    className="text-xs h-6 w-12 rounded-sm"
                    variant={"destructive"}
                    size="sm"
                    disabled={prompt.length === 0 || currentSession?.instruction === prompt}
                    onClick={() => {
                        setShowPromptEditor(false);
                        setTransPromptEditor(true);
                        updateSystemInstruction(prompt);
                    }}
                >
                    {t("confirm")}
                </Button>
            </div>
        </div>
    )
}
