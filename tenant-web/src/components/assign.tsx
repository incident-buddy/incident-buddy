import { href, Link } from "react-router";

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
  roleSlotId: string;
  roleName: string;
  roleCode: string;
  roleAbbr: string;
  roleColor: string;
  user?: {
    id: string;
    familyName: string;
    givenName: string;
    email: string;
  };
};

export function Assign({ assignment, incidentId }: { assignment: Assignment; incidentId: string }) {
  const assigneeLabel = assignment.user ? `${assignment.user.familyName} ${assignment.user.givenName}` : "未アサイン";
  const color = colorMap(assignment.roleColor);
  return (
    <div className="flex flex-row items-center gap-x-2">
      <div className={`w-9 h-9 font-medium flex items-center justify-center rounded-md ${color.bg} border ${color.bd}`}>
        <span className={color.text}>{assignment.roleAbbr}</span>
      </div>
      <div className="flex flex-col justify-between">
        <div className="text-xs text-muted-foreground">{assignment.roleName}</div>
        <div className="font-semibold text-violet-900">
          <Link
            to={href("/incident/:incidentId/assign/:roleSlotId", { incidentId, roleSlotId: assignment.roleSlotId })}
          >
            {assigneeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
