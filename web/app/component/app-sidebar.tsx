import {
  Blocks,
  Database,
  FileCheck,
  Flame,
  LayoutGrid,
  PanelsTopLeft,
  Settings2,
  Workflow,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/component/nav-main";
import { NavUser } from "@/component/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/component/ui/sidebar";
import { OrganizationMenu } from "@/component/organization-menu";

type User = {
  name: string;
  code: string;
};

type Organization = {
  name: string;
  plan: string;
};

type Menu = "HOME" | "INCIDENTS" | "SETTINGS";

type Data = {
  user: User;
  organizations: Organization[];
  available: Menu[];
};

const data: Data = {
  user: {
    name: "todokr",
    code: "U123456",
  },
  organizations: [
    {
      name: "Acme Inc",
      plan: "エンタープライズプラン",
    },
    {
      name: "Evil Corp.",
      plan: "フリープラン",
    },
  ],
  available: ["HOME", "INCIDENTS", "SETTINGS"],
};

const nav = [
  {
    title: "ダッシュボード",
    path: "/",
    icon: LayoutGrid,
  },
  {
    title: "インシデント",
    path: "/incidents",
    icon: Flame,
  },
  {
    title: "ワークフロー",
    path: "/workflows",
    icon: Workflow,
  },
  {
    title: "リソース",
    path: "/resources",
    icon: Database,
  },
  {
    title: "ステータスページ",
    path: "/status-pages",
    icon: PanelsTopLeft,
  },
  {
    title: "レポート",
    path: "/reports",
    icon: FileCheck,
  },
  {
    title: "外部連携",
    path: "/integrations",
    icon: Blocks,
  },
  {
    title: "入れ子メニュー",
    path: "/settings",
    icon: Settings2,
    items: [
      {
        title: "",
        path: "#",
      },
      {
        title: "Limits",
        path: "#",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationMenu organization={data.organizations} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
