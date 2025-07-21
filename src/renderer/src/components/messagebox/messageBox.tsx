import MessageTitleBar from "@renderer/components/messagebox/titlebar";
import MessageList from "@renderer/components/messagebox/messageList";
import SendBox from "@renderer/components/messagebox/sendbox";
import ChatPromptEditor from "@renderer/components/messagebox/chatPromptEditor";
import SearchBar from "./searchBar";
import { uiState } from "@renderer/lib/state/uistate";
import { useEffect, useRef } from "react";
import { searchState } from "@renderer/lib/state/searchState";


export default function MessageBox() {
    const isMac = uiState((state) => state.isMac);
    const setShow = searchState(state => state.setShow);
    const show = searchState(state => state.show);
    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            if (isMac) {
                if (e.metaKey && e.key === "f") {
                    e.preventDefault();
                    setShow(!show);
                }
            } else {
                if (e.key === "f" && e.ctrlKey) {
                    e.preventDefault();
                    setShow(!show);
                }
            }
        }
        document.addEventListener("keydown", keyHandler);
        return () => {
            document.removeEventListener("keydown", keyHandler);
        }
    }, [isMac, show, setShow]);
    return (
        <div className="flex flex-col flex-1 w-full h-full overflow-hidden bg-transparent">
            <MessageTitleBar />
            <ChatPromptEditor />
            <SearchBar />
            <MessageList />
            <SendBox />
        </div>
    )
}