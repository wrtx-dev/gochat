import { useCallback, useEffect, useState } from "react";
import { globalConfig } from "../state/confState";

const oldFetch = window.fetch;


export const fetchHooker = () => {
    const conf = globalConfig(conf => conf.config);
    const [hookIt, setHookIt] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const balanceFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
            const headers = new Headers(init?.headers);
            if (headers.has("x-goog-api-key") && conf && conf.balanceApikeys) {
                const len = conf.balanceApikeys.length;
                const currentApiKey = conf.balanceApikeys[currentIndex];
                headers.delete("x-goog-api-key");
                headers.set("x-goog-api-key", currentApiKey.key);
                if (currentApiKey.endPoint && typeof input === "string") {
                    const url = new URL(input);
                    url.hostname = currentApiKey.endPoint || url.hostname;
                    input = url.toString();
                }
                setCurrentIndex(prev => {
                    console.log("prev:", prev);
                    return (prev + 1) % len;
                });
            }

            return oldFetch(input, {
                ...init,
                headers: headers,
            });
        } catch (e) {
            throw e;
        }
    }, [conf?.balanceApikeys, currentIndex]);

    useEffect(() => {
        if (hookIt) {
            window.fetch = balanceFetch;
        } else {
            window.fetch = oldFetch;
        }
    }, [hookIt, balanceFetch]);
    useEffect(() => {
        setHookIt(conf?.balance ?? false);
    }, [conf?.balance])
    return {
        enableHookFetch: (flag: boolean) => setHookIt(flag)
    }
}
