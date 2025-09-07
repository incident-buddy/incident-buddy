import type { Route } from "./+types/home";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export async function loader({ context }: Route.LoaderArgs) {
	const client = createClient(IncidentService, context.transport);
	const { incidents } = await client.listIncidents({});

	return { incidents };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<h1>Incidents</h1>
			<ul>
				{loaderData.incidents.map((inc) => (
					<li key={inc.id}>{inc.title}</li>
				))}
			</ul>
		</>
	);
}
