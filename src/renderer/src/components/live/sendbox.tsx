import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Mic, ScreenShare, SendHorizonal } from "lucide-react";
import { geminiLiveSendMessage } from "@renderer/lib/ai/live/geminiLive";

export default function MessageInputBox() {
    const [messageText, setMessageText] = useState("");
    return (
        <div className="w-full p-1">
            <div className="flex flex-col bg-neutral-200/20 border rounded-md w-full h-full">
                <div className="flex flex-row w-full p-0.5 bg-transparent items-center justify-start">

                </div>
                <div className="flex flex-row w-full bg-transparent gap-1 p-1 items-end">
                    <Button
                        size={"icon"}
                        variant={"outline"}
                    >
                        <Mic strokeWidth={1} className="size-4" />
                    </Button>
                    <Button
                        size={"icon"}
                        variant={"outline"}
                    >
                        <ScreenShare strokeWidth={1} className="size-4" />
                    </Button>
                    <Textarea
                        className="flex -1w-full min-h-5 max-h-24 text-xs resize-none border-none shadow-none outline-0 focus-visible:border-none focus-visible:outline-0 focus-visible:shadow-none focus-visible:ring-0 py-1 px-1.5"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Button
                        className=" rounded-sm bg-blue-600/80 hover:bg-blue-700 gap-0.5 text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (messageText.length > 0) {
                                const msg = messageText;
                                setMessageText("");
                                geminiLiveSendMessage(msg);
                            }
                        }}
                    >
                        send
                        <SendHorizonal strokeWidth={1} className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}