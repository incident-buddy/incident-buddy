import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { href, Link, Outlet } from "react-router";
import { notFound } from "~/utils/response.ts";
import { Assign } from "@/components/assign.tsx";
import { StatusTag } from "../status-tag.tsx";
import { SummaryForm } from "./summary-form.tsx";
import { TitleForm } from "./title-form.tsx";

export async function loader({ context, params }: Route.LoaderArgs) {
	const { incidentId } = params;
	const client = createClient(IncidentService, context.transport);
	const { incident } = await client.getIncident({ id: incidentId });

	if (!incident) {
		throw notFound(`incident: ${incidentId}`);
	}

	return { incident };
}

export default function({ loaderData, params }: Route.ComponentProps) {
	const { incident } = loaderData;
	return (
		<div className="flex flex-col gap-y-4">
			<div className="flex flex-col px-6">
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
							<div className="rounded px-2 border font-semibold bg-violet-100 border-violet-300 text-violet-900">未判定</div>            <div>サービスに影響が出ており、対応が必要</div>
							</div>
						</div>
					</div>
					{/* assign*/}
					<div className="flex flex-col gap-y-2">
						<h3 className="text-lg font-medium">アサイン</h3>
						<div className="text-sm flex flex-row flex-wrap items-center gap-x-6 gap-y-3">
							<Assign
								role={{ label: "インシデントコマンダー", abbr: "IC", color: "red" }}
								onClick={function(): void {
									throw new Error("Function not implemented.");
								}}
							/>
							<Assign
								role={{ label: "影響範囲調査", abbr: "影響", color: "blue" }}
								onClick={function(): void {
									throw new Error("Function not implemented.");
								}}
							/>
							<Assign
								role={{ label: "原因調査", abbr: "原因", color: "blue" }}
								onClick={function(): void {
									throw new Error("Function not implemented.");
								}}
							/>
							<Assign
								role={{ label: "コミュニーケーションリード", abbr: "CL", color: "green" }}
								onClick={function(): void {
									throw new Error("Function not implemented.");
								}}
							/>
						</div>
					</div>
				</div>
				</div>
				<div className="py-2"><hr /></div>
				<div className="flex flex-row gap-x-2">
				<ul className="flex flex-col">
				<li><Link to={href("/incident/:incidentId", params)}>Todos</Link></li>
				<li><Link to={href("/incident/:incidentId/timeline", params)}>Timeline</Link></li>
				</ul>
				<div><Outlet /></div>
				</div>
		</div>
	);
}
