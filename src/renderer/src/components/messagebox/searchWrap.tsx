import { ReactNode, useLayoutEffect, useRef } from "react";
import Mark from "mark.js";


export default function SearchWrap({ children, query, ignoreCase, idx = -1, reverse }: { children: ReactNode, query: string | undefined, ignoreCase: boolean, idx?: number, reverse: boolean }) {
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        let marked = false;
        if (contentRef && contentRef.current && query) {
            const mark = new Mark(contentRef.current);
            const regexp = new RegExp(query, ignoreCase && /^[a-zA-Z\.\s]+$/.test(query) ? "gi" : "g");
            let index = 0;
            mark.markRegExp(regexp, {
                each: (match) => {
                    if (index === idx) {
                        match.classList.add("match-current");
                        match.scrollIntoView({
                            block: "center",
                            inline: "nearest"
                        });
                    } else {
                        match.classList.add("matches");
                    }
                    index++;
                }
            });
            marked = true;
            return () => {
                if (marked) {
                    mark.unmark();
                }
            }
        }
        return () => { };

    }, [query, ignoreCase, idx])

    return (
        <div className={`inline-flex w-full ${reverse ? "flex-row-reverse" : "flex-row"}`} ref={contentRef}>
            {children}
        </div>
    )
}
