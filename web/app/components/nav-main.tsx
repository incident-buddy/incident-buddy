import {
	ChevronRight,
	Folder,
	Forward,
	type LucideIcon,
	MoreHorizontal,
	Trash2,
} from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@remix-run/react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "~/components/ui/sidebar";

type Item = {
	title: string;
	path: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: {
		title: string;
		path: string;
	}[];
};

export function NavMain({ items }: { items: Item[] }) {
	const { isMobile } = useSidebar();
	const menu = (item: Item) => {
		if (item.items?.length) {
			return (
				<Collapsible
					key={item.title}
					asChild
					defaultOpen={item.isActive}
					className="group/collapsible"
				>
					<SidebarMenuItem>
						<CollapsibleTrigger asChild>
							<SidebarMenuButton tooltip={item.title}>
								{item.icon && <item.icon />}
								<span>{item.title}</span>
								<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
							</SidebarMenuButton>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<SidebarMenuSub>
								{item.items?.map((subItem) => (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton asChild>
											<Link to={subItem.path}>
												<span>{subItem.title}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								))}
							</SidebarMenuSub>
						</CollapsibleContent>
					</SidebarMenuItem>
				</Collapsible>
			);
		}
		return (
			<SidebarMenuItem key={item.title}>
				<SidebarMenuButton asChild>
					<Link to={item.path}>
						{item.icon && <item.icon />}
						<span>{item.title}</span>
					</Link>
				</SidebarMenuButton>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuAction showOnHover>
							<MoreHorizontal />
							<span className="sr-only">More</span>
						</SidebarMenuAction>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-48 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align={isMobile ? "end" : "start"}
					>
						<DropdownMenuItem>
							<Folder className="text-muted-foreground" />
							<span>View Project</span>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Forward className="text-muted-foreground" />
							<span>Share Project</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Trash2 className="text-muted-foreground" />
							<span>Delete Project</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		);
	};

	return (
		<SidebarGroup>
			<SidebarMenu>{items.map((item) => menu(item))}</SidebarMenu>
		</SidebarGroup>
	);
}
