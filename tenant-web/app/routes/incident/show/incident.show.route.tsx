import type { Route } from "./+types/incident.show.route.ts";
import { href, Link, Outlet, useLocation } from "react-router";
import { notFound } from "~/utils/response.ts";
import { Assign } from "@/components/assign.tsx";
import { StatusTag } from "../status-tag.tsx";
import { apiClient } from "@/lib/api-client.ts";
import { Button } from "@/components/ui/button.tsx";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { incidentId } = params;
  const response = await apiClient.incidents[":id"].$get({ param: { id: incidentId } });
  const { incident } = await response.json();
  if (!incident) {
    throw notFound(`incident: ${incidentId}`);
  }

  const assignmentRespone = await apiClient.incidents[":id"].assignment.$get({ param: { id: incidentId } });
  const { assignments } = await assignmentRespone.json();

  return { incident, assignments };
}

export default function ({ loaderData, params }: Route.ComponentProps) {
  const { incident, assignments } = loaderData;
  return (
    <div className="flex flex-col gap-y-6 h-svh max-w-4xl">
      {/* title & summary*/}
      <div className="flex flex-col pt-5 px-6 gap-y-2">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-y-1">
            <div className="flex flex-row gap-x-2">
              <StatusTag />
              <time className="text-sm text-muted-foreground">2025-08-21 19:03</time>
            </div>
            <div className="flex flex-row items-center justify-start gap-x-2 group">
              <h1 className="flex flex-row gap-x-1 text-2xl font-semibold tracking-tight items-baseline">
                {incident.code} {incident.title}
              </h1>
            </div>
          </div>
          <Button variant="secondary">編集</Button>
        </div>
        <div className="flex flex-col gap-y-3">
          <div className="text-sm inline-flex leading-6 items-start gap-x-1 rounded border bg-slate-50 border px-3 py-2 group">
            <div className="whitespace-pre-line grow">{incident.summary}</div>
          </div>
        </div>
      </div>
      {/* サービスとインシデントレベル */}
      <div className="flex flex-col gap-y-6 px-6 pb-1">
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col gap-y-2">
            <h3 className="text-lg font-medium">影響サービス</h3>
            <div>決済サービス</div>
          </div>
          <div className="col-span-3 flex flex-col gap-y-2 items-start">
            <h3 className="text-lg font-medium">インシデントレベル</h3>
            <div className="flex flex-inline gap-x-2">
              <div className="rounded px-1 border font-semibold bg-violet-50 border-violet-400 text-violet-800 text-xs leading-6">
                未判定
              </div>
              <div>サービスに影響が出ており、対応が必要</div>
            </div>
          </div>
        </div>
        {/* assign*/}
        <div className="flex flex-col gap-y-2">
          <h3 className="text-lg font-medium">アサイン</h3>
          <div className="text-sm flex flex-row flex-wrap items-center gap-x-6 gap-y-3">
            {assignments.map((assign) => {
              return <Assign key={assign.role.id} assignment={assign} incidentId={params.incidentId} />;
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-x-2 items-stretch grow border-t">
        <div className="w-[160px] border-r">
          <SubMenus incidentId={incident.id} />
        </div>
        <div className="py-6 px-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SubMenus({ incidentId }: { incidentId: string }) {
  const { pathname } = useLocation();

  const menus = [
    {
      label: "ToDoリスト",
      path: href("/incident/:incidentId", { incidentId }),
    },
    {
      label: "タイムライン",
      path: href("/incident/:incidentId/timeline", { incidentId }),
    },
  ];

  return (
    <ul className="flex flex-col px-3 py-6 gap-y-2">
      {menus.map((m) => {
        const cls = pathname === m.path ? "bg-slate-100" : "";
        return (
          <li>
            <Link to={m.path} className={`block py-2 px-2 font-semibold rounded text-sm ${cls}`}>
              {m.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
