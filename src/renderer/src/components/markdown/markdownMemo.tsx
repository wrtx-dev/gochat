
import { FC, memo } from "react";
import ReactMarkdown, { Options } from "react-markdown";


const arePropsEqual = (prevProps: Options, nextProps: Options) => {
    return prevProps.children === nextProps.children && prevProps.components === nextProps.components
};

export const MarkdownMessageMemo: FC<Options> = memo(ReactMarkdown, arePropsEqual);