import i18next from "i18next";

import * as zh_CN from "@shared/lang/zh-CN.json";
import * as en from "@shared/lang/en.json";
import * as ja from "@shared/lang/ja.json";
import * as ko from "@shared/lang/ko.json";
import * as zh_TW from "@shared/lang/zh-TW.json";

const resources = {
    'zh-CN': {
        translation: zh_CN,
    },
    'en': {
        translation: en,
    },
    'ja': {
        translation: ja,
    },
    'ko': {
        translation: ko,
    },
    'zh-TW': {
        translation: zh_TW,
    }
}

i18next.init({
    resources: resources,
    fallbackLng: "zh-CN"
})

export const t = i18next.t.bind(i18next);
export const changeLang = i18next.changeLanguage
