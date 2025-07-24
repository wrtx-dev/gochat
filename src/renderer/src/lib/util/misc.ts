import { EnumQuickWinHotKey } from "@shared/types/config";

export async function getSystemLanguage() {
    const lang = await (window.api as any).getSystemLanguage();
    return lang;
}

export async function openLink(url: string) {
    return window.api.openLink(url);
}

function getStartOfDayTimestamp(timestamp: number): number {
    const date = new Date(timestamp);

    // 设置小时、分钟、秒和毫秒为 0
    date.setHours(0, 0, 0, 0);

    return date.getTime();
}

export function formatTimestamp(timestamp: number): { tidx: number, unit: string } {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        return { tidx: -2, unit: "" };
    }

    const now = new Date();
    const date = new Date(timestamp * 1000);

    const nowTimestamp = now.getTime();
    let dateTimestamp = date.getTime();

    if (dateTimestamp > nowTimestamp) {
        return { tidx: -2, unit: "" };
    }
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (date >= todayStart) {
        return { tidx: 0, unit: "today" };
    }

    dateTimestamp = getStartOfDayTimestamp(dateTimestamp);


    const diff = nowTimestamp - dateTimestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = now.getMonth() - date.getMonth() + (now.getFullYear() - date.getFullYear()) * 12;
    const years = now.getFullYear() - date.getFullYear();
    if (days <= 1) {
        return { tidx: 0, unit: "yesterday" };
    } else if (days <= 2) {
        return { tidx: 0, unit: "theDayBeforeYesterday" };
    } else if (days >= 2 && days <= 6) {
        return { tidx: days, unit: "days" };
    } else if (weeks <= 3) {
        return { tidx: weeks, unit: "weeks" };
    } else if (months <= 11) {
        return { tidx: months, unit: "months" };
    } else {
        return { tidx: years, unit: "years" };
    }
}

export async function isMacOS() {
    const flag = await window.api.isMacOS();
    return flag;
}


export async function maxWin() {
    window.api.maxWinSize();
}

export async function minWin() {
    window.api.minWinSize();
}

export async function closeWin() {
    window.api.closeWin();
}

export async function notifyConfChanged() {
    window.api.notifyConfChanged();
}

export async function createQuickWindow(hotkey: EnumQuickWinHotKey) {
    window.api.createQuickWindow(hotkey);
}

export async function destroyQuickWindow() {
    window.api.destroyQuickWindow();
}

export async function createAppTray() {
    window.api.createAppTray();
}

export async function destroyTray() {
    window.api.destroyTray();
}

export async function changeAppLang(lang: string) {
    await window.api.changeLang(lang);
}

export async function startScrenShot() {
    await window.api.startScrenShot();
}

export async function screenShotCallback(callback: (data: string) => void) {
    window.api.screenShotCallback(callback);
}
export const isYoutubeURI = (url: string) => {
    return /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/.test(url);
}

export function getYouTubeThumbnails(url: string): {
    default?: string;
    mqdefault?: string;
    hqdefault?: string;
    sddefault?: string;
    maxresdefault?: string;
} {
    let videoId: string | null = null;

    const match = url.match(/(?:v=|youtu\.be\/|embed\/|v\/|live\/)([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
        videoId = match[1];
    } else {
        console.error(`无法从 URL "${url}" 中解析出 YouTube 视频 ID`);
        return {};
    }

    const baseUrl = `https://img.youtube.com/vi/${videoId}/`;

    return {
        default: `${baseUrl}default.jpg`, // 120x90
        mqdefault: `${baseUrl}mqdefault.jpg`, // 320x180
        hqdefault: `${baseUrl}hqdefault.jpg`, // 480x360
        sddefault: `${baseUrl}sddefault.jpg`, // 640x480
        maxresdefault: `${baseUrl}maxresdefault.jpg`, // 最高可用分辨率
    };
}


export async function saveFileDialog(data: string) {
    await window.api.saveFile(data);
}

export const showLiveWindow = async () => {
    await window.api.openLiveWindow();
}