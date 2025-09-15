import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import type { Incident } from "@pb/api/incident/v1/incident_pb";
import { SquarePen } from "lucide-react";

export function SummaryForm({ summary, onUpdated }: { summary: string; onUpdated: (payload: string) => void }) {
  return (
    <div className="text-sm inline-flex leading-6 items-start gap-x-1 rounded border bg-slate-50 border px-3 py-2 group">
      <div className="whitespace-pre-line grow">{summary}</div>
      <SquarePen size={14} className="invisible group-hover:visible" />
    </div>
  );
}
