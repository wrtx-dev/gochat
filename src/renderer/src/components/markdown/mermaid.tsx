import mermaid from "mermaid";
import { forwardRef, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "./codeblock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Fullscreen } from "lucide-react";

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
    const ref = useRef<any>(null);

    return (
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
                        <div className="w-full h-full flex flex-col">
                            <div
                                className="mermaid text-xs"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                            <div className="flex flex-row justify-end items-center gap-2 mt-2">
                                <button
                                    className="border-none shadow-none focus-visible:shadow-none focus-visible:border-none focus-visible:bg-transparent hover:bg-transparent hover:text-white focus-visible:ring-0 inline-flex flex-row items-center gap-1 text-xs"
                                    onClick={() => {
                                        if (ref && ref.current) {
                                            ref.current.open();
                                        }
                                    }}
                                >   <Fullscreen strokeWidth={1} className="size-3" />
                                    <span className="text-xs">{t("message.preview")}</span>
                                </button>
                            </div>
                        </div> : <div className="w-full h-16 flex flex-col justify-center items-center text-lg text-red-400">
                            {t('mermaidSyntaxError')}
                        </div>
                    }
                </TabsContent>
            </Tabs>
            {!loading && !error && svg && <SvgPreviewer svg={svg} ref={ref} />}
        </div>

    );
}


const SvgPreviewer = forwardRef(({ svg }: { svg: string }, ref: Ref<any>) => {
    const [open, setOpen] = useState(false);
    useImperativeHandle(ref, () => ({
        open: () => {
            setOpen(true);
        },
        close: () => {
            setOpen(false);
        },
        isOpen: () => open
    }));
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[90vw] lg:min-w-[80vw] overflow-y-auto h-[90vh] px-0.5 py-1.5 bg-gray-800/95" onEscapeKeyDown={() => setOpen(false)}>
                <DialogTitle className="text-sm font-sans w-full h-6 select-none cursor-default hidden">
                    preview mermaid graph
                </DialogTitle>
                <DialogDescription className="hidden">preview mermaid graph</DialogDescription>
                <div className="flex flex-row justify-center items-center mermaid text-xs overflow-y-auto w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
            </DialogContent>
        </Dialog>
    )
});
