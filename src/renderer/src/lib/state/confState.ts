import { create } from "zustand";
import {Config} from "@renderer/lib/data/config";

interface GlobalConfig{
    config: Config|null
    setConfig: (conf: Config|null)=>void
}

export const globalConfig = create<GlobalConfig>((set)=>({
    config: null,
    setConfig: (conf)=>set((state)=>({...state,config:conf}))
}))