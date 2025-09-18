type AssignmentColor = "red" | "blue" | "green";

function colorMap(color: AssignmentColor | string): { bd: string; bg: string; text: string } {
  switch (color) {
    case "red": {
      return { bd: "border-red-300", bg: "bg-red-50", text: "text-red-950" };
    }
    case "blue": {
      return { bd: "border-blue-300", bg: "bg-blue-50", text: "text-blue-950" };
    }
    case "green": {
      return { bd: "border-green-300", bg: "bg-green-50", text: "text-green-950" };
    }
    default: {
      return { bd: "border-gray-300", bg: "bg-gray-50", text: "text-gray-950" };
    }
  }
}

type Assignment = {
  role: {
    label: string;
    abbr: string;
    color: AssignmentColor | string;
  };
  user?: {
    first: string;
    last: string;
  };
  onClick: () => void;
};

export function Assign(props: Assignment) {
  const { role, user, onClick } = props;
  const assigneeLabel = user ? `${user.last} ${user.first}` : "未アサイン";
  const color = colorMap(role.color);
  return (
    <div className="flex flex-row items-center gap-x-2">
      <div className={`w-9 h-9 font-medium flex items-center justify-center rounded-md ${color.bg} border ${color.bd}`}>
        <span className={color.text}>{role.abbr}</span>
      </div>
      <div className="flex flex-col justify-between">
        <div className="text-xs text-muted-foreground">{role.label}</div>
        <div className="font-semibold text-violet-900">
          <button onClick={onClick}>{assigneeLabel}</button>
        </div>
      </div>
    </div>
  );
}
