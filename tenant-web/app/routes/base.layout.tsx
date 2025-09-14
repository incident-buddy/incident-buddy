import { href, Outlet } from "react-router";
import SideNav from "@/components/sidenav.tsx";
import { Cog, Flame, ListCheck } from "lucide-react";

const menus = [
  {
    label: "Incidents",
    path: href("/incident"),
    icon: Flame,
  },
  {
    label: "All Tasks",
    path: href("/task"),
    icon: ListCheck,
  },
  {
    label: "Settings",
    path: href("/setting"),
    icon: Cog,
  },
];

export default function () {
  return (
    <>
      <div className="flex min-h-screen flex-row">
        <aside className="flex w-[80px] border-r border-gray-200 dark:border-white/10 dark:bg-black/10">
          <SideNav menus={menus} />
        </aside>
        <main className="flex-grow dark:bg-gray-900/80">
          <div className="h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
