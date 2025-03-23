import {
  Blocks,
  FileCheck,
  Flame,
  LayoutGrid,
  PanelsTopLeft,
  Settings2,
  Workflow,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { OrganizationMenu } from "@/components/organization-menu";

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
    path: "/app",
    icon: LayoutGrid,
  },
  {
    title: "インシデント",
    path: "/app/incidents",
    icon: Flame,
  },
  {
    title: "ワークフロー",
    path: "/app/workflows",
    icon: Workflow,
  },
  {
    title: "レポート",
    path: "/app/reports",
    icon: FileCheck,
  },
  {
    title: "ステータスページ",
    path: "/app/status-pages",
    icon: PanelsTopLeft,
  },
  {
    title: "外部連携",
    path: "/app/integrations",
    icon: Blocks,
  },
  {
    title: "入れ子メニュー",
    path: "/app/settings",
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
