import React from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "~/components/ui/sheet";
import {SquarePen} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {IconType, ResourceIcon} from "~/components/workflow/resource-icon";

import {
  Select,
  SelectContent, SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"

export function Condition() {
  const [open, setOpen] = React.useState(false);

  const onSave = () => {
    setOpen(false);
    console.log("Saved");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-sm">条件</h3>
          <SheetTrigger><SquarePen size={16} /></SheetTrigger>
        </div>
        <div>
          <Outline />
        </div>
      </div>
      <SheetContent className="w-[600px]">
        <SheetHeader className="mb-4">
          <SheetTitle>条件の設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">

          <div className="flex flex-col justify-between gap-y-4">
            <dl>
              <dt className="text-sm font-medium text-gray-900">アイテム</dt>
              <dd className="mt-1">
                <ConditionInput />
              </dd>
            </dl>
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

function ResourceItem({
                        icon, name
                      }: { icon: IconType, name: string }) {
  return (
    <div className="flex flex-row items-center gap-x-2">
      <ResourceIcon icon={icon}/>
      <span>{name}</span>
    </div>
  )
}

function Outline() {
  return (
    <div className="flex flex-row min-h-14items-center gap-x-2 border rounded p-4 bg-white">
      <Badge variant="secondary">インシデント - 重大度</Badge>
      <span>が</span>
      <Badge variant="secondary">D2</Badge>
      <Badge variant="secondary">以上</Badge>
      <span>で実行</span>
    </div>
  )
}

/** Combo input of resource, operator and value */
function ConditionInput() {
  return (
    <div className="grid grid-cols-2 rounded border">
      <div className="col-span-2 border-b"><ResourceSelect /></div>
      <div className="border-r"><OpSelect /></div>
      <ValueInput />
    </div>
  )
}

function ResourceSelect() {
  return (
    <Select defaultValue="severity">
      <SelectTrigger className="w-full h-[52px] border-none shadow-none rounded-none">
        <SelectValue placeholder=""/>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>インシデント</SelectLabel>
          <SelectItem value="severity">
            <ResourceItem icon="incident" name="インシデント - 重大度"/>
          </SelectItem>
          <SelectItem value="affected-service">
            <ResourceItem icon="incident" name="インシデント - 影響サービス"/>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function OpSelect() {
  return (
    <Select defaultValue="eq">
      <SelectTrigger className="w-full h-[52px] border-none shadow-none rounded-none">
        <SelectValue placeholder=""/>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="eq">
          <span>等しい</span>
        </SelectItem>
        <SelectItem value="ne">
          <span>等しくない</span>
        </SelectItem>
        <SelectItem value="gte">
          <span>以上</span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

function ValueInput() {
  return (
    <Input type="text" className="w-full h-[52px] border-none shadow-none rounded-none"/>
  )
}