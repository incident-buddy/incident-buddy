import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";

type Menu = {
  label: string;
  path: string;
  icon: React.ExoticComponent<{ size: number }>;
  active?: boolean;
};

export default function (props: { menus: Menu[] }) {
  const location = useLocation();
  const { menus } = props;
  const activeClass = (isActive: boolean) =>
    isActive
      ? {
          icon: cn("text-slate-600", "bg-slate-200"),
          label: cn("text-slate-800"),
        }
      : {
          icon: cn("text-slate-400"),
          label: "",
        };

  return (
    <nav className="flex flex-col grow py-5">
      <ul className="px-2 flex flex-col gap-y-2">
        {menus.map((menu) => {
          const active = location.pathname.startsWith(menu.path);
          const ac = activeClass(active);
          return (
            <li key={menu.label}>
              <Link to={menu.path}>
                <div className={`flex flex-col items-center gap-y-1 py-2 rounded ${ac.icon}`}>
                  <div className={`flex flex-col items-center`}>{<menu.icon size={20} />}</div>
                  <div className={`text-slate-500 text-xs ${ac.label}`}>{menu.label}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
