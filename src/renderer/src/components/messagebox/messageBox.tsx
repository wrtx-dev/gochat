import MessageTitleBar from "@renderer/components/messagebox/titlebar";
import MessageList from "@renderer/components/messagebox/messageList";
import SendBox from "@renderer/components/messagebox/sendbox";
import ChatPromptEditor from "@renderer/components/messagebox/chatPromptEditor";
import SearchBar from "./searchBar";
import { uiState } from "@renderer/lib/state/uistate";
import { useEffect } from "react";
import { searchState } from "@renderer/lib/state/searchState";


export default function MessageBox() {
    const isMac = uiState((state) => state.isMac);
    const setShow = searchState(state => state.setShow);
    const show = searchState(state => state.show);
    const setQuery = searchState(state => state.setQuery);
    const resetSearch = searchState(state => state.resetSearch);
    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            let triggerFind = false;
            if (isMac) {
                if (e.metaKey && e.key === "f") {
                    triggerFind = true;
                }
            } else {
                if (e.key === "f" && e.ctrlKey) {
                    triggerFind = true;
                }
            }
            if (triggerFind) {
                e.preventDefault();
                setShow(!show);
                if (show) {
                    resetSearch();
                }
            }
        }
        document.addEventListener("keydown", keyHandler);
        return () => {
            document.removeEventListener("keydown", keyHandler);
        }
    }, [isMac, show, setShow, setQuery]);
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