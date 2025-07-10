import { FileImage, FileAudio, FileVideo, FileQuestion, FileText, Youtube } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { getFileIconType } from "@renderer/lib/util/files";
import { isYoutubeURI } from "@renderer/lib/util/misc";
import { FileInfo } from "@shared/types/message";
const getFilename = (pathname: string) => {
    const lastSep = Math.max(pathname.lastIndexOf("/"), pathname.lastIndexOf("\\"));
    if (lastSep === -1) {
        return pathname;
    }
    return pathname.substring(lastSep + 1);
}
export default function AttachmentBar({ files, delItem }: { files: FileInfo[], delItem: (item: string) => void }) {
    const { t } = useTranslation();
    return (
        <div className="w-full max-h-16 flex flex-wrap flex-row justify-start items-center px-2 py-0.5 gap-1 rounded-sm">
            {[... new Set(files)].map((f) => {
                const fileType = getFileIconType(f.path);
                let Icon = FileQuestion;
                switch (fileType) {
                    case "image":
                        Icon = FileImage;
                        break;
                    case "audio":
                        Icon = FileAudio;
                        break;
                    case "video":
                        Icon = FileVideo;
                        break;
                    case "document":
                        Icon = FileText;
                        break;
                    default:
                        if (isYoutubeURI(f.path)) {
                            Icon = Youtube;
                        } else {
                            Icon = FileQuestion;
                        }

                }
                return (
                    <Tooltip key={f.path} delayDuration={1500}>
                        <TooltipTrigger asChild>
                            <div
                                className="h-7 w-6 p-0.5 bg-neutral-400/30 inline-flex justify-center items-center rounded-sm"
                                onClick={
                                    () => delItem(f.path)
                                }
                            >
                                <Icon className="size-5 text-pink-500/85" strokeWidth={1} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {`${t("clickToDel")}  ${getFilename(f.path)}`}
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </div >
    )
}