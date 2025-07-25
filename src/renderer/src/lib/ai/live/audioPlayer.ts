
export class AudioPlayer {
    private audioContext?: AudioContext;
    private audioBuffer: Float32Array[] = [];
    private audioSource?: AudioBufferSourceNode;
    private analyser?: AnalyserNode;
    private isAudioEnded = true;
    private allAudioData: Uint8Array[] = [];
    private onStop?: (audio: string) => void;
    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        // this.analyser.connect(this.audioContext.destination);
    }

    public handleAudioData(base64Data: string, mimeType: string) {
        if (!this.audioContext) return;

        // Parse sample rate from mimeType (e.g. "audio/pcm;rate=24000")
        const sampleRate = parseInt(mimeType.split('rate=')[1]) || 24000;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        this.allAudioData.push(bytes);

        // Convert to 16-bit PCM first
        const pcmData = new Int16Array(bytes.buffer);
        const audioData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            audioData[i] = pcmData[i] / 32768.0; // Normalize to [-1, 1]
        }

        this.audioBuffer.push(audioData);

        if (!this.audioSource) {
            this.playAudio(sampleRate);
        }
    }

    private playAudio(sampleRate: number) {
        if (!this.audioContext || this.audioBuffer.length === 0) return;

        const buffer = this.audioContext.createBuffer(
            1,
            this.audioBuffer.reduce((sum, arr) => sum + arr.length, 0),
            sampleRate
        );

        const channelData = buffer.getChannelData(0);
        let offset = 0;
        this.audioBuffer.forEach(arr => {
            channelData.set(arr, offset);
            offset += arr.length;
        });
        this.audioBuffer = [];
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = buffer;
        this.audioSource.connect(this.analyser!);
        this.analyser!.connect(this.audioContext.destination);
        this.audioSource.start();
        this.isAudioEnded = false;
        this.audioSource.onended = () => {
            this.isAudioEnded = true;
            this.audioSource = undefined;
            if (this.audioBuffer.length > 0) {
                this.playAudio(sampleRate);

            } else {
                if (this.onStop) {
                    const combinedAudio = this.getCombinedAudioData();
                    if (combinedAudio) {
                        const blob = new Blob([combinedAudio], { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            this.onStop!(reader.result as string);
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            }
        };
    }

    public cleanupAudio() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource = undefined;
            this.isAudioEnded = true;
        }
        this.audioBuffer = [];
    }

    public isPlaying(): boolean {
        return !this.isAudioEnded && !!this.audioSource;
    }

    private generateWavHeader(dataLength: number, sampleRate = 24000): Uint8Array {
        const bitsPerSample = 16;
        const byteRate = sampleRate * 2; // sampleRate * numChannels * bitsPerSample/8
        const blockAlign = 2; // numChannels * bitsPerSample/8

        const header = new ArrayBuffer(44);
        const view = new DataView(header);

        // RIFF identifier
        view.setUint32(0, 0x52494646, false);
        // file length
        view.setUint32(4, 36 + dataLength, true);
        // RIFF type
        view.setUint32(8, 0x57415645, false);
        // format chunk identifier
        view.setUint32(12, 0x666d7420, false);
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (raw)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, byteRate, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, blockAlign, true);
        // bits per sample
        view.setUint16(34, bitsPerSample, true);
        // data chunk identifier
        view.setUint32(36, 0x64617461, false);
        // data chunk length
        view.setUint32(40, dataLength, true);

        return new Uint8Array(header);
    }

    public getCombinedAudioData(): Uint8Array | undefined {
        if (this.allAudioData.length === 0) return undefined;

        const pcmData = new Uint8Array(
            this.allAudioData.reduce((sum, arr) => sum + arr.length, 0)
        );
        let offset = 0;
        this.allAudioData.forEach(arr => {
            pcmData.set(arr, offset);
            offset += arr.length;
        });

        const header = this.generateWavHeader(pcmData.length);
        const wavData = new Uint8Array(header.length + pcmData.length);
        wavData.set(header, 0);
        wavData.set(pcmData, header.length);

        return wavData;
    }

    public getWavePeaks(bars: 16 | 32 | 64 | 128 = 16): number[] {
        if (!this.analyser) return [];
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        const peaks: number[] = [];
        const samplesPerBar = Math.floor(bufferLength / bars);

        for (let i = 0; i < bars; i++) {
            let maxAmplitude = 0;
            const start = i * samplesPerBar;
            const end = Math.min(start + samplesPerBar, bufferLength);

            for (let j = start; j < end; j++) {
                const amplitude = Math.abs(dataArray[j] - 128);
                maxAmplitude = Math.max(maxAmplitude, amplitude);
            }
            peaks.push(Math.floor((maxAmplitude / 128) * 100) + 1);
        }
        return peaks;
    }

    public onstop(callback: (audio: string) => void) {
        this.onStop = callback;
    }
}
