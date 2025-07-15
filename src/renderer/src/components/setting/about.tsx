import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function AboutInfo() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col justify-center items-center w-full h-full select-none">
            <Card className="sm:w-2/3 sm:h-2/3 w-full h-full">
                <CardHeader >
                    <CardTitle className="text-2xl font-bold text-center cursor-default bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {`${t("app.about")} - GoChat`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 cursor-default">
                    {t("app.aboutTitle")}
                    <p className="text-sm text-gray-600 text-center">
                        {t("app.aboutDescription")}
                    </p>
                    <a href="https://github.com/wrtx-dev/gochat" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        github repository
                    </a>
                    <a href="https://ai.wrtx.dev" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" >
                        更多信息
                    </a>
                </CardContent>
            </Card>
        </div>
    )
}
