import { FC, memo, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { HtmlPreviewer } from "./htmlPreviewer";
import { useTranslation } from "react-i18next";
import { Copy, Fullscreen } from "lucide-react";


interface CodeBlockProps {
    language: string
    value: string
}

const SYNTAX_HIGHLIGHTER_STYLE = {
    margin: 0,
    width: "100%",
    background: "transparent"
};

const CODE_STYLE = {
    fontSize: "12px",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
};

const CodeBlockComponent: FC<CodeBlockProps> = ({ language, value }) => {
    const ref = useRef<any>(null);
    const { t } = useTranslation();
    return (
        <div className="w-full overflow-y-hidden">
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                wrapLongLines
                wrapLines
                customStyle={SYNTAX_HIGHLIGHTER_STYLE}
                codeTagProps={{ style: CODE_STYLE }}
            >
                {value}
            </SyntaxHighlighter>
            <div className="flex flex-row justify-between w-full items-center gap-2 px-2">
                <span className="text-xs font-semibold font-serif text-emerald-500">
                    {language}
                </span>
                <div className="inline-flex flex-row items-center gap-1.5">
                    <button
                        className="border-none shadow-none focus-visible:shadow-none focus-visible:border-none focus-visible:bg-transparent hover:bg-transparent hover:text-white focus-visible:ring-0 inline-flex flex-row items-center gap-1 text-xs"
                        onClick={() => navigator.clipboard.writeText(value)}
                    >
                        <Copy strokeWidth={1} className="size-3" />
                        {t("message.copy")}
                    </button>
                    {language.toLowerCase() === "html" &&
                        <button
                            className="border-none shadow-none focus-visible:shadow-none focus-visible:border-none focus-visible:bg-transparent hover:bg-transparent hover:text-white focus-visible:ring-0 inline-flex flex-row items-center gap-1 text-xs"
                            onClick={() => {
                                if (ref && ref.current) {
                                    ref.current.open();
                                }
                            }}
                        >
                            <Fullscreen strokeWidth={1} className="size-3" />
                            {t("message.preview")}
                        </button>
                    }
                </div>
            </div>
            {language.toLowerCase() === "html" && <HtmlPreviewer content={value} ref={ref} />}
        </div>
    );
};

export const CodeBlock = memo(CodeBlockComponent)