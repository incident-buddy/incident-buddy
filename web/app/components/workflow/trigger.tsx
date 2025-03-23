import React, { useContext } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceIcon, IconType } from "@/components/workflow/resource-icon";

import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { MessageContext } from "@/translation";

type Entries<T> = [keyof T, T[keyof T]][];

export function Trigger() {
  const { dict } = useContext(MessageContext);
  const [open, setOpen] = React.useState(false);
  const { status, data } = useQuery({
    queryKey: ["triggers"],
    queryFn: async () => {
      const { data } = await apiClient.GET("/trigger");
      return data;
    },
  });

  const onSave = async () => {
    setOpen(false);
    console.log("Saved");
  };

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error" || !data) {
    return <p>Error!</p>;
  }

  const triggersByCategory = Object.entries(data.triggers) as Entries<
    typeof data.triggers
  >;
  const Items = () =>
    triggersByCategory.map(([categoryCode, triggers]) => {
      return (
        <div key={categoryCode} className="flex flex-col gap-y-2">
          <h3 className="font-bold text-sm text-muted-foreground">
            {dict.trigger.categoryName(`${categoryCode}`)}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {triggers.map((trigger) => (
              <TriggerItem
                key={trigger.code}
                icon={trigger.icon}
                name={dict.trigger.triggerName(trigger.code)}
              />
            ))}
          </div>
        </div>
      );
    });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-sm">{dict.trigger.trigger}</h3>
          <SheetTrigger className="p-1 outline-0">
            <SquarePen size={16} />
          </SheetTrigger>
        </div>
        <div>
          <TriggerItem icon="incident" name="インシデントの作成・更新" />
        </div>
      </div>
      <SheetContent className="sm:max-w-[640px] md:max-w-[768px]">
        <SheetHeader className="mb-4">
          <SheetTitle>トリガーの設定</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between gap-y-6">
          <div className="flex flex-col justify-between gap-y-4">
            <Items />
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

export function TriggerItem(props: { icon: IconType; name: string }) {
  return (
    <div className="flex flex-row items-center gap-x-2 py-2 px-3 rounded border bg-white">
      <ResourceIcon icon={props.icon} />
      <div className="trigger-info">
        <h4 className="text-sm font-semibold leading-tight">{props.name}</h4>
      </div>
    </div>
  );
}
