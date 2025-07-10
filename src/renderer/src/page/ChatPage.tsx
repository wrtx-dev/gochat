import { ChatTitleBar } from "@renderer/components/titlebar/chatTitleBar";
import MessageBox from "@renderer/components/messagebox/messageBox";
import { SiderBar } from "@renderer/components/sider/sider";

export default function ChatPage() {
    return (
        <div className="flex flex-col w-screen h-screen overflow-hidden">
            {/* <div className="titlebar" /> */}
            <ChatTitleBar />
            <div className="flex flex-row w-full h-full flex-1 bg-neutral-50">
                <SiderBar />
                <MessageBox />
            </div>
        </div>
    )
}