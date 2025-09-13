import { Button } from "@/components/ui/button.tsx";
import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { href, Link, Outlet, useFetcher } from "react-router";
import { notFound } from "~/utils/response.ts";
import { SquarePen } from "lucide-react";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { incidentId } = params;
  const client = createClient(IncidentService, context.transport);
  const { incident } = await client.getIncident({ id: incidentId });

  if (!incident) {
    throw notFound(`incident: ${incidentId}`);
  }

  return { incident };
}

export default function Home({ loaderData, params }: Route.ComponentProps) {
  const incident = loaderData.incident;
  return (
    <>
      <div className="flex flex-col gap-y-4">
        {/* title */}
        <div className="flex flex-row justify-between items-center py-4 px-6">
          <div className="flex flex-col gap-y-2">
            <h1 className="flex flex-row gap-x-2 text-lg text-bold">
              <span>${incident.code}</span> {incident.title}
            </h1>
          </div>
          <div>
            <Link to={href("/incident/:incidentId/edit", params)}>
              <Button variant="ghost">
                <SquarePen />
              </Button>
            </Link>
          </div>
        </div>
        {/* summary */}
        <div className="rounded bg-slate-100 border p-4 text-sm">{incident.summary}</div>
        <pre>{JSON.stringify(incident.latestStatus)}</pre>
      </div>
      <Outlet />
    </>
  );
}
