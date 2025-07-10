export enum EnumQuickWinHotKey {
    CtrlAltSpace = 0,
    CtrlShiftSpace,
    AltSpace
}

const EnumQuickWinHotKeyString: string[] = ["Ctrl+Alt+Space", "Ctrl+Shift+Space", "Alt+Space"];
export const EnumQuickWinHotKeyToString = (i: EnumQuickWinHotKey) => {
    return EnumQuickWinHotKeyString[i];
}