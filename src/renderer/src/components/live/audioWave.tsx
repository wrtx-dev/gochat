import { AudioPlayer } from "@renderer/lib/ai/live/audioPlayer";
import { useEffect, useState } from "react";

export default function AudioWave({ player }: { player: AudioPlayer | null }) {
    const [peaks, setPeaks] = useState<number[]>([]);
    useEffect(() => {
        if (!player) return;
        (async () => {
            const currentPeaks = player.getWavePeaks();
            setPeaks(currentPeaks);
        })();
        const interval = setInterval(() => {
            const currentPeaks = player.getWavePeaks(32);
            setPeaks(currentPeaks);
        }, 200);
        return () => clearInterval(interval);
    }, [player]);
    return (
        <div className="flex flex-row w-36 items-center justify-center min-h-10 max-h-10 bg-white gap-0.5">
            {peaks.map((peak, index) => {
                const height = Math.max(1, Math.floor(48 * peak / 128)); // Scale peak to a reasonable height
                return (
                    <div
                        key={`peak-${index}`}
                        className="w-[2px] bg-gradient-to-bl from-blue-500/85 to-red-400/50"
                        style={{ height: `${height}px` }}
                    />
                )
            })}
        </div>
    );
}
