import { LiveMessage } from "@shared/types/message";
import { memo, useCallback, useEffect, useState } from "react";
import { AudioPlayer } from "../../lib/ai/live/audioPlayer";
import { registerAddLiveMessage } from "@renderer/lib/ai/live/geminiLive";
import AudioWave from "./audioWave";

export default function LiveMessageBox() {
    const [audioPlayer, setAudioPlayer] = useState<AudioPlayer | null>(null);
    const [messages, setMessages] = useState<LiveMessage[]>([]);
    const addMessage = useCallback((message: LiveMessage) => {


        setMessages(prev => {
            if (prev.length === 0 || (prev[prev.length - 1].complete && (prev[prev.length - 1].role === "user" || prev[prev.length - 1].played))) {
                return [...prev, message];
            }
            const lastMessage = prev[prev.length - 1];
            const updatedMessage = { ...lastMessage, text: lastMessage.text + (message.text || ""), complete: message.complete };
            return [...prev.slice(0, -1), updatedMessage];
        });

        if (message.audio) {
            if (!audioPlayer) {
                const player = new AudioPlayer();
                setAudioPlayer(player);
                player.onstop((audio) => {
                    setMessages(prev => {
                        const lastIndex = prev.length - 1;
                        const updatedMessages = [...prev];
                        if (lastIndex > 0 && updatedMessages[lastIndex]) {
                            updatedMessages[lastIndex] = {
                                ...prev[lastIndex],
                                dataurl: audio,
                                played: true,
                            };
                        }
                        return updatedMessages;
                    });
                    setAudioPlayer(null);
                })
                player.handleAudioData(message.audio.data || "", message.audio.mimeType || "");
            } else {
                audioPlayer.handleAudioData(message.audio.data || "", message.audio.mimeType || "");
            }

        }


    }, [setMessages, audioPlayer]);

    useEffect(() => {
        registerAddLiveMessage(addMessage);
    }, [addMessage]);
    return (
        <div className="flex flex-col w-full h-full flex-1 bg-white rounded-sm overflow-x-hidden overflow-y-auto gap-y-0.5">
            {messages.map((msg, idx) => {
                return (
                    <div key={msg.role + idx} className={`inline-flex w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} jusitfy-start gap-x-2 px-1`}>
                        {msg.role === "user" && <UserMessage message={msg} />}
                        {msg.role === "model" && <ModelMessage message={msg} player={audioPlayer} />}
                    </div>
                )
            })}
        </div>
    )
}

const UserMessage = memo(({ message }: { message: LiveMessage }) => {
    return (
        <div className="p-2 bg-neutral-300/50 rounded-br-2xl rounded-bl-sm rounded-t-sm inline-flex max-w-2/3 braek-all">
            {message.text && <p className="text-sm">{message.text}</p>}
            {(!message.text || message.text.length === 0) &&
                <p className="text-xs text-gray-500">No text content</p>
            }
        </div>
    );
}, (prev, next) => {
    return prev.message.text === next.message.text && prev.message.complete === next.message.complete;
});

const ModelMessage = memo(({ message, player }: { message: LiveMessage, player: AudioPlayer | null }) => {
    return (
        <div className="p-2 bg-transparent rounded">

            {(message.played === undefined && player) && <AudioWave player={player} />}
            {(message.dataurl && message.played) &&
                <audio
                    controls
                    src={message.dataurl}
                />
            }
            {message.text && message.text.length > 0 && <p className="text-sm">{message.text}</p>}
        </div>
    );
}, (prev, next) => {
    return prev.message.text === next.message.text && prev.message.complete === next.message.complete && prev.player === next.player && prev.message.played === next.message.played && prev.message.dataurl === next.message.dataurl;
});
