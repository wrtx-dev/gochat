import { create } from "zustand";


export interface SearchMatch {
    listIndex: number;
    start: number;
    end: number;
    indexInMessage: number;
}

export interface SearchState {
    query?: string,
    show: boolean,
    searchRange: SearchMatch[] | undefined;
    currentIndex: number,
    ignoreCase: boolean,
    setShow: (flag: boolean) => void,
    setQuery: (q: string | undefined) => void,
    setSearchRange: (r: SearchMatch[] | undefined) => void,
    resetSearch: () => void,
    addCurrentIndex: () => void,
    subCurrentIndex: () => void,
    setIgnoreCase: (ingore: boolean) => void,
}

export const searchState = create<SearchState>((set) => ({
    query: undefined,
    show: false,
    searchRange: undefined,
    currentIndex: -1,
    ignoreCase: true,
    setShow: (flag) => set((state) => ({ ...state, show: flag })),
    setQuery: (q: string | undefined) => set((state) => ({ ...state, query: q })),
    setSearchRange: (r: SearchMatch[] | undefined) => set((state) => ({ ...state, searchRange: r, currentIndex: -1 })),
    resetSearch: () => set((state) => ({ ...state, query: undefined, searchRange: undefined, show: false, currentIndex: -1, ignoreCase: true })),
    addCurrentIndex: () => set((state) => ({ ...state, currentIndex: state.currentIndex + 1 >= state.searchRange!.length ? 0 : state.currentIndex + 1 })),
    subCurrentIndex: () => set((state) => ({ ...state, currentIndex: state.currentIndex - 1 < 0 ? state.searchRange!.length - 1 : state.currentIndex - 1 })),
    setIgnoreCase: (ingore) => set((state) => ({ ...state, ignoreCase: ingore })),

}));
