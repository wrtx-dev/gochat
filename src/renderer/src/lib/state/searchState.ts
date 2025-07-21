import { create } from "zustand";


export interface SearchState {
    query?: string,
    show: boolean,
    setShow: (flag: boolean) => void,
    setQuery: (q: string | undefined) => void,
}

export const searchState = create<SearchState>((set) => ({
    query: undefined,
    show: false,
    setShow: (flag) => set((state) => ({ ...state, show: flag })),
    setQuery: (q: string | undefined) => set((state) => ({ ...state, query: q }))
}));