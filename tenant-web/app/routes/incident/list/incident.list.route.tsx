

import type { Route } from "./+types/incident.list.route.ts";
import { createClient } from "@connectrpc/connect";
import { Color, IncidentService, IncidentStatusType } from "@pb/api/incident/v1/incident_pb.ts";
import { href, Link, Outlet } from "react-router";
import { Filter } from "./filter.tsx"
import { console } from "node:inspector/promises";
import { colorFromCode, statusStyle as colorStyle, statusTypeFromCode, type ColorType, type StatusType } from "../util.ts";

export function meta({ }: Route.MetaArgs) {
	return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export async function action(args: Route.ActionArgs) {
	console.log(args);
}

export async function loader({ context }: Route.LoaderArgs) {
	const client = createClient(IncidentService, context.transport);
	const result = await client.listIncidents({});
	const incidents = result.incidents.map((inc) => {
		const latestStatus = {
			...inc.latestStatus!,
			color: colorFromCode(inc.latestStatus!.color),
			type: statusTypeFromCode(inc.latestStatus!.type),
		}
		return { ...inc, latestStatus };
	});
	return { incidents };
}
export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex flex-row h-screen">
			{/* incident list + filter*/}
			<div className="flex flex-col gap-y-2 min-w-xs w-1/4 border-r p-3">
				<h1 className="font-semibold text-lg">Incidents</h1>
				<Filter />
				<ul className="flex flex-col gap-y-2">
					{loaderData.incidents.map((inc) => (
						<li key={inc.id}>
							<Link className="flex flex-row gap-x-2" to={href("/incident/:incidentId", { incidentId: inc.id })}>
							<Card {...inc} status={inc.latestStatus} />
							</Link>
						</li>
					))}
				</ul>
			</div>
			<div className="">
				<Outlet />
			</div>
		</div>
	);
}

function Card({ title, summary, status }: { title: string, summary: string; status: { type: StatusType,  color: ColorType} }) {
	const circleStyle = colorStyle(status.color).circle?.bg;
	const isUnresolved = status.type !== "CLOSED";
	return (
		<div className="flex flex-col rounded shadow-xs p-3 border gap-y-2 w-full">
			<div className="flex flex-row items-start justify-between grow">
				<div className="flex flex-row gap-x-1 items-center">
					<h3 className="text-sm font-semibold">{title}</h3>
					{isUnresolved && circleStyle && <i className={`w-2.5 h-2.5 rounded-full ${circleStyle}`}></i>}
				</div>
				<time className="text-xs text-muted-foreground">3時間前</time>
			</div>
			<div>
				<p className="line-clamp-2 text-xs text-muted-foreground">{summary}</p>
			</div>
		</div>
	)
}
