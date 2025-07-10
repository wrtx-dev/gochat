import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Expand } from "lucide-react"

export default function ImagePreview({ src }: { src: string }) {

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size={"icon"}
                    variant={"ghost"}
                    className="size-5 rounded-sm font-extralight text-white text-xs bg-transparent hover:bg-white/50 hover:text-white"
                >
                    <Expand strokeWidth={1} />
                </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="p-0 max-w-[90vh] overflow-x-hidden overflow-y-auto rounded-none border-none bg-transparent outline-none shadow-none w-auto" onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}>
                <DialogHeader className="hidden">
                    <DialogDescription>image preview</DialogDescription>
                    <DialogTitle>image preview</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-center items-center">
                    <img
                        src={src}
                        draggable={false}
                        className={`object-contain max-w-full max-h-[80vh] `}

                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
