import { Link } from "react-router";
import { cn } from "@/lib/utils";

type Menu = {
  label: string;
  path: string;
  icon: React.ExoticComponent<{ size: number }>;
  active?: boolean;
};

export default function (props: { menus: Menu[] }) {
  const { menus } = props;
  const iconClass = (isActive?: boolean) => (isActive ? cn("text-slate-600", "bg-slate-200") : cn("text-slate-400"));

  return (
    <nav className="flex flex-col grow py-5">
      <ul className="px-2 flex flex-col gap-y-5">
        {menus.map((menu) => (
          <li key={menu.label}>
            <Link to={menu.path}>
              <div className="flex flex-col items-center gap-y-1">
                <div className={cn("flex flex-col items-center w-full rounded py-1", iconClass(menu.active))}>
                  {<menu.icon size={26} />}
                </div>
                <div className="text-slate-500 text-xs">{menu.label}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
