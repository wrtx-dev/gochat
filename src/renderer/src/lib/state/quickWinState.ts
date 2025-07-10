import { create } from "zustand";

interface quickWinState {
    mouseForward: boolean,
    setMouseForward: (flag: boolean) => void,
}

export const quickState = create<quickWinState>((set) => (
    {
        mouseForward: true,
        setMouseForward: (flag: boolean) => set((state) => ({ ...state, mouseForward: flag })),
    }
))