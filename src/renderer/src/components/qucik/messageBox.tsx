import MessageList from "../messagebox/messageList";

export default function QuickMessageBox() {
    return (
        <div className="w-full h-full overflow-x-hidden overflow-y-auto bg-green-200">
            <MessageList />
        </div>
    )
}