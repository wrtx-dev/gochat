
export const setMouseIgnore = (ignore: boolean) => {
    window.quick.setIgnoreMouse(ignore);
}

export const hideWindow = () => {
    window.quick.hideWindow();
}

export const resetWindowShadow = () => {
    window.quick.recalcShadow();
}

export const resetWindowSize = (size: { w: number, h: number }) => {
    window.quick.resetSize(size);
}

export const onConfChanged = (callback: () => void) => {
    window.quick.onConfChanged(callback);
}

export const onWindowBlur = (callback: () => void) => {
    window.quick.onWindowBlur(callback);
}
