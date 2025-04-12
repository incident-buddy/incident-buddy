import { MessageContext } from "@/translation";
import { useContext } from "react";
import { AlertTriangle } from "lucide-react";

export function Error() {
  const { dict } = useContext(MessageContext);
  return (
    <div className="flex gap-x-2 rounded border border-red-400 bg-white text-sm text-red-600 px-4 py-2">
      <AlertTriangle size={16} />
      <span>
        {dict.error.generic}
      </span>
    </div>
  );
}
