import { useCallback, useEffect, useState } from "react";
import { globalConfig } from "../state/confState";

const oldFetch = window.fetch;


export const fetchHooker = () => {
    const conf = globalConfig(conf => conf.config);
    const [hookIt, setHookIt] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const balanceFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        try {
            // 保留原始请求的所有属性
            const requestInit = init ? { ...init } : {};
            const headers = new Headers(requestInit.headers);

            // 仅当需要平衡API keys时才修改请求
            if (headers.has("x-goog-api-key") && conf?.balanceApikeys?.length) {
                const len = conf.balanceApikeys.length;
                const currentApiKey = conf.balanceApikeys[currentIndex];

                // 修改API key和endpoint
                headers.set("x-goog-api-key", currentApiKey.key);
                if (currentApiKey.endPoint && typeof input === "string") {
                    const url = new URL(input);
                    url.hostname = currentApiKey.endPoint;
                    input = url.toString();
                }

                // 更新index (移除调试log)
                setCurrentIndex(prev => (prev + 1) % len);
            }

            // 直接返回fetch的Promise，保持完全一致的异步行为
            return oldFetch(input, {
                ...requestInit,
                headers: headers
            });
        } catch (e) {
            console.error('Fetch hook error:', e);
            // 保持与原始fetch一致的错误返回方式
            if (e instanceof Error) {
                return Promise.reject(e);
            }
            return Promise.reject(new Error(String(e)));
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
    }, [conf?.balance]);

    return {
        enableHookFetch: (flag: boolean) => setHookIt(flag)
    };
}
