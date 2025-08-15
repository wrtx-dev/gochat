import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { ApikeyInfo } from "@renderer/lib/data/config";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { KeySquare, Link2, Cloud, SquarePen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function ApikeyControllor({ apikeys, balance, currentInuse, banceKeys, onApikeyChange }: { apikeys?: ApikeyInfo[], currentInuse?: ApikeyInfo, banceKeys?: ApikeyInfo[], balance?: boolean, onApikeyChange: (info: ApikeyInfo[], banceKeys: ApikeyInfo[], balance: boolean, useApikey?: ApikeyInfo) => void }) {
    const [keys, setKeys] = useState<ApikeyInfo[]>(apikeys ?? []);
    const [openApikeyDialog, setOpenApikeyDialog] = useState(false);
    const [apikey, setApikey] = useState("");
    const [provider, setProvider] = useState("");
    const [endpoint, setEndpoint] = useState("");
    const [apiBalance, setApiBalance] = useState(balance === undefined ? false : balance);
    const [_balanceKeys, set_BalanceKeys] = useState<ApikeyInfo[]>(banceKeys ? banceKeys : []);
    const [apikeyInuse, setApikeyInuse] = useState<ApikeyInfo | undefined>(currentInuse);
    const [editApikey, setEditApikey] = useState<ApikeyInfo | undefined>(undefined);
    const [editIdx, setEditIdx] = useState(-1);
    const [openEditor, setOpenEditor] = useState(false);
    const { t } = useTranslation();
    return (
        <div className="w-full inline-flex flex-row gap-2">
            <Popover>
                <PopoverTrigger
                    className="flex-1 border rounded-md select-none"
                    disabled={keys.length === 0}
                >
                    {keys.length > 0 ? balance === undefined || !balance ? apikeyInuse ? apikeyInuse.key : t("conf.addApikeyfirst") : t("conf.apiBalance") : t("conf.addApikeyfirst")}
                </PopoverTrigger>
                <PopoverContent className="min-w-(--radix-popover-trigger-width) py-1 px-1.5">
                    <span
                        className="inline-flex flex-row justify-start items-center gap-2 w-full hover:bg-neutral-400/20 p-1.5 rounded-sm"
                        onClickCapture={() => {
                            setApiBalance(prev => {
                                onApikeyChange(keys, _balanceKeys, !prev);
                                return !prev;
                            })
                        }}
                    >
                        <Checkbox checked={apiBalance} />
                        <p className="text-sm select-none font-mono">{t("conf.apiBalance")}</p>
                    </span>
                    <div
                        role="separator"
                        aria-orientation="horizontal"
                        className="bg-border my-1 h-px"
                    />
                    {!apiBalance ? <>
                        <RadioGroup
                            value={apikeyInuse ? apikeyInuse.key : ""}
                            className="gap-0"
                        >
                            {keys.map((k, idx) => {
                                return (
                                    <div
                                        className="w-full inline-flex flex-row justify-start items-center gap-2 hover:bg-neutral-400/20 p-1.5 rounded-sm"
                                        key={k.key}
                                    >
                                        <div
                                            className="inline-flex flex-row w-[90%] gap-1 border-r"
                                            onClickCapture={() => {
                                                setApikeyInuse(k);
                                                onApikeyChange(keys, _balanceKeys, apiBalance, k);
                                            }}
                                        >
                                            <RadioGroupItem
                                                value={k.key}
                                            />
                                            <div className="w-full flex-1 flex flex-col">
                                                <span className="select-none text-xs font-semibold inline-flex flex-row items-center gap-1">
                                                    <KeySquare className="size-3" />
                                                    {k.key}
                                                </span>
                                                <span className="select-none text-xs inline-flex flex-row items-center gap-1">
                                                    <Cloud className="size-3" />
                                                    {k.provider === undefined || k.provider.length === 0 ? "default" : k.provider}
                                                </span>
                                                <span className="select-none text-xs inline-flex flex-row items-center gap-1">
                                                    <Link2 className="size-3" />
                                                    {k.endPoint === undefined || k.endPoint.length === 0 ? "default" : k.endPoint}
                                                </span>
                                            </div>

                                        </div>
                                        <Button
                                            size="icon"
                                            variant={"secondary"}
                                            className="size-4 text-xs rounded-full"
                                            onClick={() => {
                                                setEditApikey(k);
                                                setEditIdx(idx);
                                                setOpenEditor(true);
                                            }}
                                        >
                                            <SquarePen />
                                        </Button>
                                        <Button
                                            size={"icon"}
                                            variant={"secondary"}
                                            className="size-4 text-xs rounded-full"
                                            onClick={() => {
                                                const delKey = keys[idx];
                                                setKeys(prev => {
                                                    const newKeys = prev.filter(v => v.key !== delKey.key || v.endPoint !== delKey.endPoint || v.provider !== delKey.provider);
                                                    set_BalanceKeys(prev => {
                                                        const newBkeys = prev.filter(v => v.key !== delKey.key || v.endPoint !== delKey.endPoint || v.provider !== delKey.provider);
                                                        onApikeyChange(newKeys, newBkeys, apiBalance);
                                                        return newBkeys;
                                                    })
                                                    return newKeys;
                                                })
                                            }}
                                        >
                                            <Trash2 />
                                        </Button>

                                    </div>
                                )
                            })}
                        </RadioGroup>
                    </> :
                        <>
                            {keys.map((k, idx) => {
                                return (
                                    <div
                                        className="w-full inline-flex flex-row justify-start items-center gap-2 hover:bg-neutral-400/20 p-1.5 rounded-sm"
                                        key={`${k.key}-${idx}`}
                                    >
                                        <div
                                            className="inline-flex flex-row w-[90%] gap-1 border-r"
                                            onClickCapture={() => {
                                                if (_balanceKeys.includes(k)) {
                                                    set_BalanceKeys(prev => {
                                                        const newKeys = prev.filter(v => v.key !== k.key || v.endPoint !== k.endPoint || v.provider !== k.provider);
                                                        onApikeyChange(keys, newKeys, apiBalance, apikeyInuse);
                                                        return newKeys;
                                                    })
                                                } else {
                                                    set_BalanceKeys(prev => {
                                                        const newKeys = [...prev, k];
                                                        onApikeyChange(keys, newKeys, apiBalance);
                                                        return newKeys;
                                                    })
                                                }
                                            }}
                                        >
                                            <Checkbox
                                                checked={_balanceKeys.filter(v => v.key === k.key && v.endPoint === k.endPoint && v.provider === k.provider).length > 0}
                                            />
                                            <div className="w-full flex-1 flex flex-col">
                                                <span className="select-none text-xs font-semibold inline-flex flex-row items-center gap-1">
                                                    <KeySquare className="size-3" />
                                                    {k.key}
                                                </span>
                                                <span className="select-none text-xs inline-flex flex-row items-center gap-1">
                                                    <Cloud className="size-3" />
                                                    {k.provider === undefined || k.provider.length === 0 ? "default" : k.provider}
                                                </span>
                                                <span className="select-none text-xs inline-flex flex-row items-center gap-1">
                                                    <Link2 className="size-3" />
                                                    {k.endPoint === undefined || k.endPoint.length === 0 ? "default" : k.endPoint}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant={"secondary"}
                                            className="size-4 text-xs rounded-full"
                                            onClick={() => {
                                                setEditApikey(k);
                                                setEditIdx(idx);
                                                setOpenEditor(true);
                                            }}
                                        >
                                            <SquarePen />
                                        </Button>
                                        <Button
                                            size={"icon"}
                                            variant={"secondary"}
                                            className="size-4 text-xs rounded-full"
                                            onClick={() => {
                                                const delKey = keys[idx];
                                                setKeys(prev => {
                                                    const newKeys = prev.filter(v => v.key !== delKey.key || v.endPoint !== delKey.endPoint || v.provider !== delKey.provider);
                                                    set_BalanceKeys(prev => {
                                                        const newBkeys = prev.filter(v => v.key !== delKey.key || v.endPoint !== delKey.endPoint || v.provider !== delKey.provider);
                                                        onApikeyChange(newKeys, newBkeys, apiBalance);
                                                        return newBkeys;
                                                    })
                                                    return newKeys;
                                                })
                                            }}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                )
                            })}
                        </>}
                </PopoverContent>
            </Popover>

            <Button
                className="text-xs"
                onClick={() => setOpenApikeyDialog(true)}
            >
                {t("conf.addApikey")}
            </Button>
            <Dialog open={openApikeyDialog} onOpenChange={setOpenApikeyDialog}>
                <DialogContent className="p-0.5" showCloseButton={false}>
                    <DialogHeader className="p-0.5">
                        <DialogTitle className="w-full inline-flex flex-row justify-center items-center">
                            {t("conf.addApikey")}
                        </DialogTitle>
                        <DialogDescription className="hidden">
                            {t("conf.addApikey")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-1.5 items-center px-2">
                        <span className="select-none col-span-1">{t("apikey")}</span>
                        <Input
                            className="col-span-2 input-common focus-visible:ring-0 text-xs"
                            value={apikey}
                            onChange={(e) => setApikey(e.target.value)}
                        />
                        <span className="select-none col-span-1">{t("provider")}</span>
                        <Input
                            className="col-span-2 input-common focus-visible:ring-0"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                        />
                        <span className="select-none col-span-1">{t("endpoint")}</span>
                        <Input
                            className="col-span-2 input-common focus-visible:ring-0"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="px-2">
                        <Button
                            size={"sm"}
                            disabled={apikey.length === 0}
                            onClick={() => {
                                setOpenApikeyDialog(false);
                                setApikey("");
                                setEndpoint("");
                                setProvider("");
                                setKeys(prev => {
                                    const newKeys = [...prev, { key: apikey, endPoint: endpoint, provider: provider }];
                                    onApikeyChange(newKeys, _balanceKeys, apiBalance);
                                    return newKeys;
                                });
                            }}
                        >
                            {t("add")}
                        </Button>
                        <Button
                            size={"sm"}
                            onClick={() => {
                                setOpenApikeyDialog(false);
                                setApikey("");
                                setEndpoint("");
                                setProvider("");
                            }}
                        >
                            {t("cancel")}
                        </Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

            <Dialog open={openEditor} onOpenChange={setOpenEditor}>
                <DialogContent className="p-0.5" showCloseButton={false}>
                    <DialogHeader className="p-0.5">
                        <DialogTitle className="w-full inline-flex flex-row justify-center items-center select-none">{t("conf.editApi")}</DialogTitle>
                        <DialogDescription className="hidden">
                            edit api key
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-5 gap-1.5 items-center px-2">
                        <span className="select-none col-span-1">{t("apikey")}</span>
                        <Input
                            className="col-span-4 input-common focus-visible:ring-0 text-xs"
                            value={editApikey?.key || ''}
                            onChange={(e) => setEditApikey(editApikey ?
                                { ...editApikey, key: e.target.value } :
                                { key: e.target.value, provider: '', endPoint: '' })}
                        />
                        <span className="select-none col-span-1">{t("provider")}</span>
                        <Input
                            className="col-span-4 input-common focus-visible:ring-0"
                            value={editApikey?.provider || ""}
                            onChange={(e) => setEditApikey(editApikey ?
                                { ...editApikey, provider: e.target.value } :
                                { key: '', provider: e.target.value, endPoint: '' })}
                        />
                        <span className="select-none col-span-1">{t("endpoint")}</span>
                        <Input
                            className="col-span-4 input-common focus-visible:ring-0"
                            value={editApikey?.endPoint || ""}
                            onChange={(e) => setEditApikey(editApikey ?
                                { ...editApikey, endPoint: e.target.value } :
                                { key: '', provider: '', endPoint: e.target.value })}
                        />
                    </div>
                    <DialogFooter className="px-2">
                        <Button
                            size={"sm"}
                            onClick={() => {
                                setEditApikey(undefined);
                                setEditIdx(-1);
                                setOpenEditor(false);
                            }}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            size={"sm"}
                            disabled={!editApikey}
                            onClick={() => {
                                setKeys(prev => {
                                    setEditApikey(undefined);
                                    setEditIdx(-1);
                                    setOpenEditor(false);
                                    if (editIdx >= 0) {
                                        const oldKey = prev[editIdx];
                                        const newKeys = [...prev];
                                        set_BalanceKeys(prev => {
                                            let j = -1;
                                            for (let i = 0; i < prev.length; i++) {
                                                if (prev[i].key === oldKey.key && prev[i].endPoint === oldKey.endPoint && prev[i].provider === oldKey.provider) {
                                                    j = i;
                                                    break;
                                                }
                                            }
                                            if (j >= 0) {
                                                const newBkeys = [...prev];
                                                newBkeys[j] = editApikey!;
                                                onApikeyChange(newKeys, newBkeys, apiBalance, editApikey);
                                                return newBkeys;
                                            }
                                            return prev;
                                        })
                                        newKeys[editIdx] = editApikey!;
                                        return newKeys;
                                    }
                                    return prev;
                                })
                            }}
                        >
                            {t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
        </div>
    )
}
