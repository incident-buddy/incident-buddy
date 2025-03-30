import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SquarePen, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconType, ResourceIcon } from "@/components/workflow/resource-icon";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Hr } from "@/components/hr";

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
          <h3 className="font-bold text-md">条件</h3>
          <SheetTrigger className="p-1 outline-0">
            <SquarePen size={16} />
          </SheetTrigger>
        </div>
        <div>
          <Outline />
        </div>
      </div>
      <SheetContent className="sm:max-w-[640px] md:max-w-[768px]">
        <SheetHeader className="mb-4">
          <SheetTitle>条件の設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">
          <div className="flex flex-col justify-between gap-y-2">
            <ConditionInput deletable={false} />
            <Hr text="かつ" />
            <ConditionInput deletable={true} />
            <div className="add-item flex flex-col items-center">
              <Button variant="secondary" className="h-8 w-8 p-0 rounded-full">
                <Plus />
              </Button>
            </div>
          </div>
          <div className="footer">
            <div className="flex justify-end gap-x-2">
              <Button variant="default" onClick={onSave}>
                設定
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Outline() {
  return (
    <div className="flex flex-col gap-y-0.5">
      <OutlineItem />
      <Hr text="かつ" />
      <OutlineItem />
    </div>
  );
}

function OutlineItem() {
  return (
    <div className="flex flex-row gap-x-2 items-center border rounded py-2 px-3 bg-white text-md">
      <Badge variant="secondary">インシデント - 重大度</Badge>
      <span>が</span>
      <Badge variant="secondary">D2</Badge>
      <Badge variant="secondary">以上</Badge>
    </div>
  );
}

function ResourceItem({ icon, name }: { icon: IconType; name: string }) {
  return (
    <div className="flex flex-row items-center gap-x-2">
      <ResourceIcon icon={icon} />
      <span>{name}</span>
    </div>
  );
}

/** Combo input of resource, operator and value */
function ConditionInput(props: { deletable: boolean }) {
  const hidden = props.deletable ? "" : "invisible";
  return (
    <div className="flex flex-row gap-x-2">
      <ResourceSelect />
      <OpSelect />
      <ValueInput type="select" />
      <div className={`w-12 h-[52px] flex items-center ${hidden}`}>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
          <Trash />
        </Button>
      </div>
    </div>
  );
}

function ResourceSelect() {
  return (
    <Select defaultValue="severity">
      <SelectTrigger className="w-full h-[52px]">
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>インシデント</SelectLabel>
          <SelectItem value="severity">
            <ResourceItem icon="incident" name="インシデント - 重大度" />
          </SelectItem>
          <SelectItem value="affected-service">
            <ResourceItem icon="incident" name="インシデント - 影響サービス" />
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function OpSelect() {
  return (
    <Select defaultValue="eq">
      <SelectTrigger className="w-full h-[52px]">
        <SelectValue placeholder="" />
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
  );
}

type ValueInputType = "select" | "text-input";
function ValueInput(props: { type: ValueInputType }) {
  switch (props.type) {
    case "select":
      return (
        <Select defaultValue="severity">
          <SelectTrigger className="w-full h-[52px]">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="severity">
              <span>D2</span>
            </SelectItem>
            <SelectItem value="affected-service">
              <span>サービスA</span>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    case "text-input":
      return <Input placeholder="値を入力" />;
  }
}
