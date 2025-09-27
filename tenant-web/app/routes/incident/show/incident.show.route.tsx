import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { href, Link, Outlet, useLocation } from "react-router";
import { notFound } from "~/utils/response.ts";
import { Assign } from "@/components/assign.tsx";
import { StatusTag } from "../status-tag.tsx";
import { SummaryForm } from "./summary-form.tsx";
import { TitleForm } from "./title-form.tsx";
import { AssignmentService } from "@pb/api/incident/v1/assignment_pb.ts";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { incidentId } = params;
  const incidentClient = createClient(IncidentService, context.transport);
  const { incident } = await incidentClient.getIncident({ id: incidentId });
  if (!incident) {
    throw notFound(`incident: ${incidentId}`);
  }

  const assignmentClient = createClient(AssignmentService, context.transport);
  const { assignments } = await assignmentClient.listAssignments({ incidentId: incident.id });

  return { incident, assignments };
}

export default function ({ loaderData, params }: Route.ComponentProps) {
  const { incident, assignments } = loaderData;
  return (
    <div className="flex flex-col gap-y-4 h-svh max-w-4xl">
      <div className="flex flex-col px-6 pb-2">
        {/* title */}
        <div className="flex flex-col py-5">
          <div className="flex flex-row gap-x-2">
            <StatusTag />
            <time className="text-sm text-muted-foreground">2025-08-21 19:03</time>
          </div>
          <TitleForm code={incident.code} title={incident.title} />
        </div>
        <div className="flex flex-col gap-y-6">
          {/* summary */}
          <div className="flex flex-col gap-y-2">
            <h3 className="text-lg font-medium">概要</h3>
            <SummaryForm summary={incident.summary} onUpdated={(payload) => console.log(payload)} />
          </div>
          {/* サービスとインシデントレベル */}
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
                return <Assign key={assign.roleId} assignment={assign} incidentId={params.incidentId} />;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-x-2 items-stretch grow border-t">
        <div className="w-[160px] border-r">
          <SubMenus incidentId={incident.id} />
        </div>
        <div>
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
    <ul className="flex flex-col px-3 py-4 gap-y-2">
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
