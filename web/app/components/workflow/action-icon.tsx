import * as lucide from "lucide-react";

export type IconType = "mail" | "slack"

export function ActionIcon(props: { icon: IconType }) {
  const cls = "border p-1 rounded flex items-center justify-center w-8 h-8";
  switch (props.icon) {
    case "mail":
      return (
        <div className={`${cls} text-blue-400 bg-blue-100 border-blue-200`}>
          <lucide.Mail size={20}/>
        </div>
      )
    case "slack":
      return (
        <div className={`${cls} text-purple-400 bg-purple-100 border-purple-200`}>
          <lucide.Slack size={24}/>
        </div>
      )
  }
}