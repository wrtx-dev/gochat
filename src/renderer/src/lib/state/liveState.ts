import { create } from "zustand";


export interface LiveState {
    connected: boolean,
    setConnected: (flag: boolean) => void;
}

export const liveState = create<LiveState>((set) => ({
    connected: false,
    setConnected: (flag: boolean) => set((state) => ({ ...state, connected: flag }))
}));