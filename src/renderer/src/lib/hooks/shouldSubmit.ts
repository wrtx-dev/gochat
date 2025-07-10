import { useEffect, useRef } from "react";

export const useSubmitHandler = () => {
    const isComposing = useRef(false);
    useEffect(() => {
        const onCompositionStart = () => {
            isComposing.current = true;
        };
        const onCompositionEnd = () => {
            isComposing.current = false;
        };
        window.addEventListener("compositionstart", onCompositionStart);
        window.addEventListener("compositionend", onCompositionEnd);

        return () => {
            window.removeEventListener("compositionstart", onCompositionStart);
            window.removeEventListener("compositionend", onCompositionEnd);
        };
    }, []);
    const isEnterKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Fix Chinese input method "Enter" on Safari
        if (e.keyCode == 229) return false;
        if (e.key !== "Enter") return false;
        if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
            return false;
        return true;
    }
    return {
        isEnterKeyDown,
    };
}