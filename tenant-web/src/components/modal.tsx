import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  title: string;
  lead?: string;
  ignoreOverrayClick?: boolean;
  ignoreEscape?: boolean;
  children: (closefn: () => void) => React.ReactNode;
};
export function Modal(props: Props) {
  const navigate = useNavigate();
  const close = () => navigate("../");
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        !props.ignoreEscape && close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div
      onClick={() => !props.ignoreOverrayClick && close()}
      className="fixed inset-0 w-screen h-screen bg-slate-800/30 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-lg bg-white rounded border shadow py-5 px-6 flex flex-col gap-y-4"
      >
        <div className="flex flex-row items-center justify-between">
          <div className="text-lg leading-none font-semibold">{props.title}</div>
          <Button variant="ghost" onClick={close}>
            <X />
          </Button>
        </div>
        {props.lead && <p className="text-muted-foreground text-sm">{props.lead}</p>}
        {props.children(close)}
      </div>
    </div>
  );
}
