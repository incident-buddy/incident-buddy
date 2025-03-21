import React from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "~/components/ui/sheet";
import {SquarePen} from "lucide-react";
import {Button} from "~/components/ui/button";

export function Condition() {
  const [open, setOpen] = React.useState(false);

  const onSave = () => {
    setOpen(false);
    console.log("Saved");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold">条件</h3>
          <SheetTrigger><SquarePen size={16} /></SheetTrigger>
        </div>
        <div>
          XがBの場合
        </div>
      </div>
      <SheetContent className="w-[600px]">
        <SheetHeader className="mb-4">
          <SheetTitle>条件の設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">
          <div className="flex flex-col justify-between gap-y-4">
            ほげほげ
          </div>
          <div className="footer">
            <div className="flex justify-end gap-x-2">
              <Button variant="default" onClick={onSave}>保存</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}