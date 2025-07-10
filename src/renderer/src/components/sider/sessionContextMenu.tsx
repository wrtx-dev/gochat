import { session } from "@shared/types/session";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";


export interface SessionProps {
    x: number,
    y: number,
    onClose: () => void,
    session: session,
    contextMenuItemHandler?: (action: "del" | "edit", s: session) => void
}
export default function SessionItemContextMenu({ x, y, onClose, session, contextMenuItemHandler }: SessionProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [ypos, setYPos] = useState(y);
    const { t } = useTranslation();
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 0);
        const windowHeight = window.innerHeight;

        if (menuRef && menuRef.current) {
            if (ypos + menuRef.current.offsetHeight > windowHeight) {
                setYPos(ypos - menuRef.current.offsetHeight);
            }
        }
    }, []);



    return (
        <div
            ref={menuRef}
            className={`fixed z-50 bg-neutral-50 border border-gray-100 rounded-sm shadow-md px-1 py-1 w-28 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
                top: `${ypos}px`,
                left: `${x}px`,
            }}
        >
            <ul className="list-none px-1 py-0">
                <li className="select-none cursor-pointer rounded-sm hover:bg-neutral-200" onClick={() => {
                    console.log("rename:", session.sessionName);
                    // document.dispatchEvent(new CustomEvent<session>('rename-session', { detail: session }));
                    onClose();
                    if (contextMenuItemHandler) {
                        contextMenuItemHandler("edit", session);
                    }
                }}>
                    <span className="px-1 text-gray-600">{t("renameSession")}</span>
                </li>
                <li className="select-none cursor-pointer rounded-sm hover:bg-neutral-200" onClick={() => {
                    onClose();
                    // document.dispatchEvent(new CustomEvent<session>('delete-session', { detail: session }));
                    if (contextMenuItemHandler) {
                        contextMenuItemHandler("del", session);
                        console.log("show del dialog")
                    }
                }}>
                    <span className="px-1 text-gray-600">{t("deleteSession")}</span>
                </li>
            </ul>
        </div>
    )
}