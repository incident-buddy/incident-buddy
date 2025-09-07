import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { notFound } from "~/utils/response.ts";

export async function loader({ context, params }: Route.LoaderArgs) {
	const { incidentId } = params;
	const client = createClient(IncidentService, context.transport);
	const { incident } = await client.getIncident({id: incidentId});

	if (!incident) {
		throw notFound(`incident: ${incidentId}`);
	}

	return { incident };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const incident = loaderData.incident;
	return (
		<>
		<div className="flex flex-col gap-y-4">
		<h1 className="flex flex-row gap-x-2 text-2xl"><span>${incident.code}</span> {incident.title}</h1>
		<p>{incident.description}</p>
		</div>
		</>
	);
}
