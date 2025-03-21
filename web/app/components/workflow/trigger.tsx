import React from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "~/components/ui/sheet";
import {SquarePen, Flame} from "lucide-react";
import {Button} from "~/components/ui/button";

export function Trigger() {
  const [open, setOpen] = React.useState(false);

  const onSave = () => {
    setOpen(false);
    console.log("Saved");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold">トリガー</h3>
          <SheetTrigger><SquarePen size={16} /></SheetTrigger>
        </div>
        <div>
          <TriggerItem category="incident" name="インシデントの作成・更新" />
        </div>
      </div>
      <SheetContent className="w-[600px]">
        <SheetHeader className="mb-4">
          <SheetTitle>トリガーの設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">
          <div className="flex flex-col justify-between gap-y-4">
            <div className="flex flex-col gap-y-2">
              <h3 className="font-bold text-muted-foreground">インシデント</h3>
              <div className="grid grid-cols-2 gap-2">
                <TriggerItem category="incident" name="インシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新やインシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新" />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <h3 className="font-bold text-muted-foreground">インシデント</h3>
              <div className="grid grid-cols-2 gap-2">
                <TriggerItem category="incident" name="インシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新" />
                <TriggerItem category="incident" name="インシデントの作成・更新" />
              </div>
            </div>
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

type Category = "incident"
export function TriggerItem(props: {category: Category, name: string}) {
  return (
    <div className="flex flex-row min-h-14 items-center gap-x-2 py-2 px-3 rounded border bg-card text-card-foreground">
      <Icon category={props.category} />
      <div className="trigger-info">
        <h4 className="text-sm font-semibold leading-tight">{props.name}</h4>
      </div>
    </div>
  )
}


function Icon(props: {category: Category}) {
  const cls = "border p-1 rounded"
  switch (props.category) {
    case "incident":
      return <div className={`${cls} text-red-400 bg-red-100 border-red-200`}>
        <Flame size={24} />
      </div>
  }
}