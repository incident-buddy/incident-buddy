type AssignmentColor = "red" | "blue" | "green";

const colorMap: { [key in AssignmentColor]: { bd: string; bg: string; text: string } } = {
  red: {
    bd: "border-red-300",
    bg: "bg-red-50",
    text: "text-red-950",
  },
  blue: {
    bd: "border-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-950",
  },
  green: {
    bd: "border-green-300",
    bg: "bg-green-50",
    text: "text-green-950",
  },
};

type Assignment = {
  role: {
    label: string;
    abbr: string;
    color: AssignmentColor;
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
  return (
    <div className="flex flex-row items-center gap-x-2">
      <div
        className={`w-9 h-9 font-medium flex items-center justify-center rounded-md ${colorMap[role.color].bg} border ${colorMap[role.color].bd}`}
      >
        <span className={colorMap[role.color].text}>{role.abbr}</span>
      </div>
      <div className="flex flex-col justify-between">
        <div className="text-xs text-muted-foreground">{role.label}</div>
        <div className="font-semibold">
          <button onClick={onClick}>{assigneeLabel}</button>
        </div>
      </div>
    </div>
  );
}
