import type { Route } from "./+types/incident.show.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb";
import { href, Link, Outlet } from "react-router";
import { notFound } from "~/utils/response.ts";
import { SquarePen } from "lucide-react";
import { Assign } from "@/components/assign.tsx";
import { StatusTag } from "../status-tag.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"

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
		<>
			<div className="flex flex-col px-6">
				{/* title */}
				<div className="flex flex-col py-5">
					<div className="flex flex-row gap-x-2">
						<StatusTag />
						<time className="text-sm text-muted-foreground">2025-08-21 19:03</time>
					</div>
					<div className="flex flex-row items-center justify-between">
						<h1 className="flex flex-row gap-x-1 text-2xl font-semibold tracking-tight items-baseline">
							<span>
								{incident.code} {incident.title}
							</span>
						</h1>
						<Dialog>
							<form>
								<DialogTrigger asChild>
									<SquarePen size={18} />
								</DialogTrigger>
								<DialogContent className="sm:max-w-[425px]">
									<DialogHeader>
										<DialogTitle>Edit profile</DialogTitle>
										<DialogDescription>
											Make changes to your profile here. Click save when you&apos;re
											done.
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4">
										<div className="grid gap-3">
											<Label htmlFor="name-1">Name</Label>
											<Input id="name-1" name="name" defaultValue="Pedro Duarte" />
										</div>
										<div className="grid gap-3">
											<Label htmlFor="username-1">Username</Label>
											<Input id="username-1" name="username" defaultValue="@peduarte" />
										</div>
									</div>
									<DialogFooter>
										<DialogClose asChild>
											<Button variant="outline">Cancel</Button>
										</DialogClose>
										<Button type="submit">Save changes</Button>
									</DialogFooter>
								</DialogContent>
							</form>
						</Dialog>



					</div>
				</div>
				<div className="flex flex-col gap-y-3">
					{/* summary */}
					<div className="flex flex-col gap-y-2">
						<h3 className="text-md font-medium">概要</h3>
						<div className="text-sm inline-flex leading-6 items-start gap-x-1 rounded border bg-slate-50 border px-3 py-2">
							<div className="whitespace-pre-line grow">{incident.summary}</div>
							<Link to={href("/incident/:incidentId/edit", params)}>
								<SquarePen size={12} />
							</Link>
						</div>
					</div>
					{/* assign*/}
					<div className="flex flex-col gap-y-2">
						<h3 className="text-md font-medium">アサイン</h3>
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
			<Outlet />
		</>
	);
}
