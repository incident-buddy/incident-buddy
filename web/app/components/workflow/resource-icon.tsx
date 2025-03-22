import {Flame} from "lucide-react";

export type IconType = "incident"

export function ResourceIcon(props: { icon: IconType }) {
  const cls = "border p-1 rounded flex items-center justify-center w-8 h-8"
  switch (props.icon) {
    case "incident":
      return (
        <div className={`${cls} text-red-400 bg-red-100 border-red-200`}>
          <Flame size={24}/>
        </div>
      )
  }
}