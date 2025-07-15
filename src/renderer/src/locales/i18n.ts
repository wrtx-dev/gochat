import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import * as zh_CN from "@shared/lang/zh-CN.json";
import * as en from "@shared/lang/en.json";
import * as ja from "@shared/lang/ja.json";
import * as ko from "@shared/lang/ko.json";

export const langs = ["zh-CN", "en", "ja", "ko"];
export const langMaps = new Map([
    ["zh-CN", "简体中文"],
    ["en", "English"],
    ["ja", "日本語"],
    ["ko", "한국어"],
]);
const resources = {
    "zh-CN": {
        translation: zh_CN,
    },
    "en": {
        translation: en,
    },
    "ja": {
        translation: ja,
    },
    "ko": {
        translation: ko,
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "zh-CN",
    fallbackLng: "zh-CN",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
