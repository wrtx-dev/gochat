import { forwardRef, Ref, useImperativeHandle, useState } from "react";
import { Dialog, DialogContent, DialogDescription } from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";


interface HtmlPreviewerProps {
    content: string;
}

const HtmlPrivewDialog = forwardRef(({ content }: HtmlPreviewerProps, ref: Ref<any>) => {
    const [openDialog, setOpenDialog] = useState(false);
    useImperativeHandle(ref, () => (
        {
            open: () => {
                setOpenDialog(true);
            },
            close: () => {
                setOpenDialog(false);
            },
            isOpen: () => openDialog
        }
    ))
    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="min-w-[90vw] lg:min-w-[80vw] overflow-y-auto h-[90vh] px-0.5 py-1.5" onEscapeKeyDown={() => setOpenDialog(false)}>
                <DialogTitle className="text-sm font-sans w-full h-6 select-none cursor-default hidden">
                    preview HTML content
                </DialogTitle>
                <DialogDescription className="hidden">preview html content</DialogDescription>
                <div className="w-full h-full overflow-y-auto">
                    <iframe
                        className="w-full h-full overflow-auto"
                        srcDoc={content.replace(
                            /<script/g,
                            `<script nonce="32014d26e3d73692b63b178934542b20"`
                        )}
                        title="HTML Preview"
                        sandbox="allow-scripts"
                    />
                </div>
            </DialogContent>

        </Dialog>
    );
});

HtmlPrivewDialog.displayName = "HtmlPreviewer";

export const HtmlPreviewer = HtmlPrivewDialog;
