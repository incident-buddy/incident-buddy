type AssignmentColor = "red" | "blue" | "green";

const colorMap: { [key in AssignmentColor]: { bg: string; text: string } } = {
  red: {
    bg: "bg-red-500",
    text: "text-white",
  },
  blue: {
    bg: "bg-blue-800",
    text: "text-white",
  },
  green: {
    bg: "bg-green-700",
    text: "text-white",
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
      <div className={`w-9 h-9 font-medium flex items-center justify-center rounded-md ${colorMap[role.color].bg}`}>
        <span className={colorMap[role.color].text}>{role.abbr}</span>
      </div>
      <div className="flex flex-col justify-between">
        <div className="text-xs text-muted-foreground">{role.label}</div>
        <div className="font-medium">
          <button onClick={onClick}>{assigneeLabel}</button>
        </div>
      </div>
    </div>
  );
}
