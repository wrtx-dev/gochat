import mermaid from "mermaid";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "./codeblock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export default function Mermaid({ content, loading }: { content: string, loading?: boolean }) {
    const { t } = useTranslation();
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'dark',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        });
    }, []);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(false);
    const id = `mermaid-${crypto.randomUUID()}`;
    const [lastRenderedCode, setLastRenderedCode] = useState('');

    useEffect(() => {
        if (!content.trim() || content === lastRenderedCode) {
            return;
        }

        const renderMermaid = async () => {
            if (loading === true) {
                return;
            }
            try {
                // console.log("code before parse:", code);
                await mermaid.parse(content);
                const { svg } = await mermaid.render(id, content);
                setSvg(svg);
                setError(false);
                setLastRenderedCode(content);
            } catch (err) {
                setError(true);
            }
        };

        const timer = setTimeout(renderMermaid, 100);
        return () => clearTimeout(timer);
    }, [content, lastRenderedCode, loading]);


    return (
        <>
            <div className="w-full">
                <Tabs defaultValue={"graph"}>
                    <TabsList className="text-xs h-6 rounded-xs bg-transparent gap-0.5">
                        <TabsTrigger value="graph" className="rounded-xs data-[state=inactive]:text-white data-[state=inactive]:bg-white/20">{t('graph')}</TabsTrigger>
                        <TabsTrigger value="code" className="rounded-xs data-[state=inactive]:text-white data-[state=inactive]:bg-white/20">{t('code')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="code">
                        <CodeBlock
                            language="mermaid"
                            value={content}
                        />
                    </TabsContent>
                    <TabsContent value="graph">
                        {loading === true &&
                            <div className="w-full h-16 flex flex-row justify-center items-center text-lg text-red-400">
                                {t('renderingGraph')}
                                <div className="border rounded-full size-6 border-t-red-500 animate-spin" />
                            </div>}
                        {!error ?
                            <div
                                className="mermaid text-xs"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            /> : <div className="w-full h-16 flex flex-col justify-center items-center text-lg text-red-400">
                                {t('mermaidSyntaxError')}
                            </div>
                        }
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
