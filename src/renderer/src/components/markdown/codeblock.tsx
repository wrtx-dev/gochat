import { FC, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";


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
                <button
                    className="btn btn-ghost btn-xs border-none shadow-none focus-visible:shadow-none focus-visible:border-none focus-visible:bg-transparent hover:bg-transparent hover:text-white focus-visible:ring-0"
                    onClick={() => navigator.clipboard.writeText(value)}
                >
                    copy
                </button>
            </div>
        </div>
    );
};

export const CodeBlock = memo(CodeBlockComponent)