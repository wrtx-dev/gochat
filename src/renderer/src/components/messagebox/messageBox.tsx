import MessageTitleBar from "@renderer/components/messagebox/titlebar";
import MessageList from "@renderer/components/messagebox/messageList";
import SendBox from "@renderer/components/messagebox/sendbox";
import ChatPromptEditor from "@renderer/components/messagebox/chatPromptEditor";


export default function MessageBox() {
    return (
        <div className="flex flex-col flex-1 w-full h-full overflow-hidden bg-transparent">
            <MessageTitleBar />
            <ChatPromptEditor />
            <MessageList />
            <SendBox />
        </div>
    )
}