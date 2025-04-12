import React, { useContext } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/component/ui/sheet";
import { SquarePen } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Skeleton } from "@/component/ui/skeleton";
import { MessageContext } from "@/translation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

import { IconType, ResourceIcon } from "@/component/workflow/resource-icon";
import { Error } from "@/component/error";
import { paths } from "generated/openapi/schema";

type Entries<T> = [keyof T, T[keyof T]][];

type Props = {
  selected?: string;
  setSelected: (selected?: string) => void;
};

type Response =
  paths["/trigger"]["get"]["responses"]["200"]["content"]["application/json"];
export function Trigger({ selected, setSelected }: Props) {
  const { dict } = useContext(MessageContext);
  const [open, setOpen] = React.useState(false);
  const { status, data } = useQuery({
    queryKey: ["triggers"],
    queryFn: async () => {
      const { data } = await apiClient.GET("/trigger");
      return data;
    },
  });

  const onSelect = async (selected?: string) => {
    setOpen(false);
    setSelected(selected);
    console.log("Saved", selected);
  };

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">{dict.trigger.trigger}</h3>
          <div className="p-1 outline-0">
            <SquarePen size={16} />
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">{dict.trigger.trigger}</h3>
          <div className="p-1 outline-0">
            <SquarePen size={16} />
          </div>
        </div>
        <div>
          <Error />
        </div>
      </div>
    );
  }

  const triggersByCategory = Object.entries(data.triggers) as Entries<
    typeof data.triggers
  >;
  const triggers = new Map(
    triggersByCategory
      .flatMap(([, triggers]) => triggers)
      .map((t) => [`${t.code}`, t]),
  );

  const SelectedItem = (props: { code?: string }) => {
    if (!props.code) {
      return (
        <p className="text-md text-muted-foreground">
          {dict.generic.state.notSelected}
        </p>
      );
    }
    const trigger = triggers.get(props.code);
    if (!trigger) {
      console.error("Unknown trigger", props);
      return (
        <p className="text-md text-muted-foreground">
          {dict.generic.state.notSelected}
        </p>
      );
    }
    return (
      <TriggerItem
        icon={trigger.icon}
        name={dict.trigger.triggerName(trigger.code)}
      />
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">{dict.trigger.trigger}</h3>
          <SheetTrigger className="p-1 outline-0">
            <SquarePen size={16} />
          </SheetTrigger>
        </div>
        <div>
          <SelectedItem code={selected} />
        </div>
      </div>
      <TriggerSetting res={data} onSelect={onSelect} />
    </Sheet>
  );
}

function TriggerSetting(props: {
  res: Response;
  current?: string;
  onSelect: (selected?: string) => void;
}) {
  const { dict } = useContext(MessageContext);
  const [active, setActive] = React.useState(props.current);

  const { triggers } = props.res;
  const triggersByCategory = Object.entries(triggers) as Entries<
    typeof triggers
  >;
  const Items = () =>
    triggersByCategory.map(([categoryCode, triggers]) => {
      return (
        <div key={categoryCode} className="flex flex-col gap-y-2">
          <h3 className="font-bold text-md text-muted-foreground">
            {dict.trigger.categoryName(`${categoryCode}`)}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {triggers.map((trigger) => {
              return (
                <button
                  key={trigger.code}
                  onClick={() => setActive(trigger.code)}
                >
                  <TriggerItem
                    icon={trigger.icon}
                    name={dict.trigger.triggerName(trigger.code)}
                    active={active === trigger.code}
                  />
                </button>
              );
            })}
          </div>
        </div>
      );
    });
  return (
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
            <Button variant="default" onClick={() => props.onSelect(active)}>
              設定
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

function TriggerItem(props: {
  icon: IconType;
  name: string;
  active?: boolean;
}) {
  const style = props.active
    ? "bg-white border-blue-600 shadow shadow-blue-200"
    : "bg-white";
  return (
    <div
      className={`flex flex-row items-center gap-x-2 py-2 px-3 rounded border ${style}`}
    >
      <ResourceIcon icon={props.icon} />
      <div className="trigger-info">
        <h4 className="text-md font-semibold leading-tight">{props.name}</h4>
      </div>
    </div>
  );
}
