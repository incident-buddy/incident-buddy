import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router";

const states = [
  { status: "all", label: "All" },
  { status: "ongoing", label: "Ongoing" },
  { status: "closed", label: "Closed" },
] as const;

type StatusFilter = keyof (typeof states)[number]["status"];

type Props = {
  onClick: (status: StatusFilter) => void;
};

export function Filter() {
  const location = useLocation();
  const filter = parseSearchParams(location.search);

  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <div className="flex p-1 rounded-lg bg-slate-100 w-fit">
          {states.map(({ status, label }) => {
            const variant = status === filter.status ? "default" : "ghost";
            return (
              <Button key={label} type="submit" name="status" value={status} size="xs" variant={variant}>
                {label}
              </Button>
            );
          })}
        </div>
      </div>
      {/* search */}
      <Input type="search" name="search" className="bg-white" placeholder="Search" />
      {/* status toggle */}
    </div>
  );
}

function parseSearchParams(search: string) {
  const params = new URLSearchParams(search);
  const status = params.get("status") ?? "ongoing";
  return { status };
}
