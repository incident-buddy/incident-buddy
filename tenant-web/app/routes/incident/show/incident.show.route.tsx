import { Button } from "@/components/ui/button.tsx";
import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { href, Link, Outlet } from "react-router";
import { notFound } from "~/utils/response.ts";
import { SquarePen } from "lucide-react";
import { Assign } from "@/components/assign.tsx";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { incidentId } = params;
  const client = createClient(IncidentService, context.transport);
  const { incident } = await client.getIncident({ id: incidentId });
	console.log(incident);

  if (!incident) {
    throw notFound(`incident: ${incidentId}`);
  }

  return { incident };
}

export default function Home({ loaderData, params }: Route.ComponentProps) {
  const incident = loaderData.incident;
  return (
    <>
      <div className="flex flex-col gap-y-6">
        {/* title */}
        <div className="flex flex-col gap-y-1">
          <time className="">{incident.declaredAt?.seconds}</time>
          <div className="flex flex-row items-center">
            <h1 className="flex flex-row gap-x-1 text-xl text-bold items-center">
              <span>
                ${incident.code} {incident.title}
              </span>
              <Link to={href("/incident/:incidentId/edit", params)}>
                <SquarePen size={20} />
              </Link>
            </h1>
          </div>
        </div>
        {/*  */}
        {/* summary */}
        <div className="flex flex-col gap-y-1">
          <h3>概要</h3>
          <div className="text-sm inline-flex items-center gap-x-1">
            <span>{incident.summary}</span>
            <Link to={href("/incident/:incidentId/edit", params)}>
              <SquarePen size={12} />
            </Link>
          </div>
        </div>
        {/* assign*/}
        <div className="flex flex-col gap-y-1">
          <h3>アサイン</h3>
          <div className="text-sm flex flex-row items-center gap-x-3">
            <Assign
              role={{ label: "インシデントコマンダー", abbr: "IC", color: "red" }}
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
            <Assign
              role={{ label: "影響範囲調査", abbr: "影響", color: "blue" }}
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
            <Assign
              role={{ label: "原因調査", abbr: "原因", color: "green" }}
              onClick={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </div>
        </div>
        <pre>{JSON.stringify(incident.latestStatus)}</pre>
      </div>
      <Outlet />
    </>
  );
}
