import LiveMessageBox from "./liveMessageBox";
import MessageInputBox from "./sendbox";

export default function LiveMessageArea() {
    return (
        <div className="flex flex-1 flex-col">
            <LiveMessageBox />
            <MessageInputBox />
        </div>
    )
}