import React from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "~/components/ui/sheet";
import {SquarePen, GripHorizontal, ChevronsDownUp, ChevronsUpDown} from "lucide-react";
import {Button} from "~/components/ui/button";
import {ActionIcon, IconType} from "~/components/workflow/action-icon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function Steps() {
  return (
    <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
      <div className="flex flex-row items-center justify-between">
        <h3 className="font-bold text-sm">ステップ</h3>
      </div>
      <div className="flex flex-col gap-y-1">
        <Step />
        <Step />
        <Step />
        <div className="flex justify-center mt-2">
          <Button variant="outline">ステップを追加</Button>
        </div>
      </div>
    </div>
  )
}

export function Step() {
  const [open, setOpen] = React.useState(false);

  const onSave = () => {
    setOpen(false);
    console.log("Saved");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <StepCard icon="mail" name="メールの送信" />
      <SheetContent className="sm:max-w-[640px] md:max-w-[768px]">
        <SheetHeader className="mb-4">
          <SheetTitle>ステップの設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">
          <div className="flex flex-col justify-between gap-y-4">
            <div className="flex flex-col gap-y-2">
              <h3 className="font-bold text-sm text-muted-foreground">Slack</h3>
              <div className="grid grid-cols-2 gap-3">
                <ActionItem icon="slack" name="Slackメッセージの送信" />
                <ActionItem icon="slack" name="Slackチャンネルの作成" />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <h3 className="font-bold text-sm text-muted-foreground">メール</h3>
              <div className="grid grid-cols-2 gap-2">
                <ActionItem icon="mail" name="メールの送信" />
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

export function StepCard(props: {icon: IconType, name: string}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-sm border bg-card text-card-foreground bg-white">
      <div className="flex flex-row gap-x-2 gap-y-2 items-center p-3 border-b">
        <ActionTitle icon={props.icon} name={props.name} />
        <div className="flex flex-row items-center">
          <Button variant="ghost" className="w-8 h-8 p-0 rounded-full"><SheetTrigger><SquarePen size={16} /></SheetTrigger></Button>
          <div className="w-8 h-8 p-2"><GripHorizontal size={16} /></div>
        </div>
      </div>
      <div>
          <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="flex flex-row items-start justify-between p-3 gap-y-2">
            <div className="flex flex-col gap-y-2">
              <dl className="grid grid-cols-4 gap-x-4">
                <dt className="font-semibold text-gray-400 text-sm">送信先アドレス</dt>
                <dd className="col-span-3 text-sm">hello@zarafa-app.com</dd>
              </dl>
              <dl className="grid grid-cols-4 gap-x-4">
                <dt className="font-semibold text-gray-400 text-sm">件名</dt>
                <dd className="col-span-3 text-sm">インシデントの作成・更新</dd>
              </dl>
              <CollapsibleContent>
                <dl className="grid grid-cols-4 gap-x-4">
                  <dt className="font-semibold text-gray-400 text-sm">メール本文</dt>
                  <dd className="col-span-3 text-sm">
                    <div className="whitespace-pre-wrap">
                      {`インシデントが作成または更新されました。
インシデント番号: {{incident.number}}
インシデント名: {{incident.name}}
インシデントの重要度: {{incident.severity}}
インシデントのステータス: {{incident.status}}
インシデントの担当者: {{incident.assignee}}
`}
                    </div>
                  </dd>
                </dl>
              </CollapsibleContent>
            </div>
            <CollapsibleTrigger className="text-gray-600">
              {open ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
            </CollapsibleTrigger>

          </Collapsible>

      </div>
    </div>

  )
}

function ActionTitle(props: {icon: IconType, name: string}) {
  return (
    <div className="flex grow gap-x-2 items-center">
      <ActionIcon icon={props.icon} />
      <div className="flex flex-col grow justify-between">
        <h4 className="text-sm font-semibold leading-tight">{props.name}</h4>
      </div>
    </div>
  )
}

function ActionItem(props: {icon: IconType, name: string}) {
  return (
    <div className="p-2 rounded border bg-white">
      <ActionTitle icon={props.icon} name={props.name} />
    </div>
  )
}