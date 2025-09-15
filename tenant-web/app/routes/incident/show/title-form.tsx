import { SquarePen } from "lucide-react";

export function TitleForm({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex flex-row items-center justify-start gap-x-2 group">
      <h1 className="flex flex-row gap-x-1 text-2xl font-semibold tracking-tight items-baseline">
        <span>
          {code} {title}
        </span>
      </h1>
      <SquarePen size={18} className="invisible group-hover:visible" />
    </div>
  );
}
