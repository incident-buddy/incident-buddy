import { Outlet } from "react-router";
import SideNav from "~/components/sidenav.tsx";

export default function() {
	return (
		<>
			<div className="flex min-h-screen flex-row">
				<aside className="flex w-xs border-r border-gray-200 dark:border-white/10 dark:bg-black/10">
				<SideNav menus={[
					{ label: "Dashboard", path: "/" },
					{ label: "Workflow", path: "/workflow" },
				]} />
				</aside>
				<main className="flex-grow dark:bg-gray-900/80">
				  <div className="p-6"><Outlet /></div>
				</main>
			</div>
		</>
	)
}
