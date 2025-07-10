import { FC, memo, useEffect, useMemo, useState } from "react"
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from 'rehype-katex';
import rehypeRaw from "rehype-raw";
import 'katex/dist/katex.min.css';
// import 'rehype-katex/dist/katex.min.css'
import { CodeBlock } from "./codeblock";
import React from "react";
import { MarkdownMessageMemo } from "./markdownMemo";
import { Button } from "../ui/button";
import { openLink } from "@renderer/lib/util/misc";
import { Save } from "lucide-react"
import Mermaid from "./mermaid";
import { saveImage } from "@renderer/lib/util/files";
import ImagePreview from "./imagePreviewDialog";



const InlineCode: FC<React.HTMLAttributes<HTMLElement>> = ({ children }) => (
    <code className={`prose prose-sm  bg-gray-100 text-gray-800 rounded-sm text-sm before:content-none after:content-none font-mono font-light`}>{children}</code>
);
const createImageUrlData = (src: string) => {
    const urlObj = new URL(src);
    if (urlObj.host === "dev.xwrt.aichatter") {
        const dataURL = urlObj.pathname.slice(1);
        return dataURL;
    } else {
        return src;
    }
}
const MarkdownMessage: FC<{ content: string, disableRawHtml?: boolean, finished?: boolean }> = (content) => {
    const remarkPlugins = [remarkGfm, remarkMath, remarkBreaks];
    const rehypePlugins = content.disableRawHtml === true ? [rehypeKatex] : [rehypeRaw, rehypeKatex];
    const components = useMemo(() => ({
        img: function Image({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
            const [hideBar, setHidebar] = useState(true);
            const [imageUrl, setImageUrl] = useState<undefined | string>(undefined);
            useEffect(() => {
                (async () => {
                    if (src) {
                        const u = createImageUrlData(src);
                        setImageUrl(u);
                    }
                })();
            }, [src]);
            return (
                <span
                    className="relative inline-block p-1 bg-neutral-100/55 max-w-[80%] rounded-sm gap-y-1 border border-neutral-300/75"
                    onMouseEnter={() => setHidebar(false)}
                    onMouseOver={() => setHidebar(false)}
                    onMouseLeave={() => setHidebar(true)}
                >
                    {imageUrl ? <>
                        <img className="max-w-full max-h-80 not-prose rounded-sm shadow-sm block object-cover" {...props} src={createImageUrlData(src!)} />
                        <span
                            className={`absolute bg-black/50 bg-opacity-70 px-2 bottom-1 py-1 rounded-md right-2 flex flex-row-reverse gap-0.5 not-prose ${hideBar ? "opacity-0" : "opacity-100"} transition-all duration-300`}
                        >
                            <ImagePreview src={createImageUrlData(src!)} />
                            <Button
                                size={"icon"}
                                variant={"ghost"}
                                className="size-5 rounded-sm font-extralight text-white text-xs bg-transparent hover:bg-white/50 hover:text-white"
                                onClick={() => {
                                    saveImage(createImageUrlData(src!));
                                }}
                            >
                                <Save strokeWidth={1} className="size-4" />
                            </Button>
                        </span>
                    </>
                        :
                        <div className="flex flex-row justify-center items-center w-16 h-16">
                            <div className="w-8 h-8 rounded-full border-t-blue-500/50  border-2 animate-spin" />
                        </div>}
                </span>
            );
        },
        a: function Anchor({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
            return <a  {...props}
                className="cursor-pointer"
                target="__blank"
                onClick={() => {
                    // console.log("open href:", href);
                    // BrowserOpenURL(href || "");
                    if (href && href.length > 0) {
                        openLink(href);
                    }
                }} />
        },
        code: function Code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
            const childArray = React.Children.toArray(children);
            const match = /language-(\w+)/.exec(className || "");
            if ((String(childArray).match(/\n/g) || []).length < 1) {
                const wrapCode = String(childArray).replace("\"", "");
                return (
                    <InlineCode {...props}>{wrapCode}</InlineCode>
                );
            }

            if (match && match[1] === 'mermaid') {
                const code = useMemo(() => {
                    const rawCode = Array.isArray(childArray) ? childArray.join('') : String(childArray);
                    return rawCode.replace(/\n$/, "");
                }, [childArray]);
                return (
                    <Mermaid content={code} loading={content.finished === undefined ? false : !content.finished} />
                )
            }

            return (
                <CodeBlock
                    language={(match && match[1]) || ""}
                    value={String(childArray).replace(/\n$/, "")}
                    {...props}
                />
            );
        },
        inlineCode: InlineCode
    }), [content.finished]);
    return (

        <div className="prose prose-xs sm:prose-sm text-xs sm:text-sm prose-headings:text-sm prose-table:text-xs max-w-full dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 xl:prose-pre:max-w-[75%] prose-pre:max-w-[98%] min-w-full space-y-6 break-words prose-code:whitespace-pre-wrap">
            <MarkdownMessageMemo
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={components}
            >
                {content.content}
            </MarkdownMessageMemo>
        </div>

    );
};

export default memo(MarkdownMessage);
