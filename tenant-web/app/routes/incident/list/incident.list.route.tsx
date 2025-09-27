import type { Route } from "./+types/incident.list.route.ts";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb.ts";
import { href, Link, Outlet, useLocation } from "react-router";
import { Filter } from "./filter.tsx";
import { console } from "node:inspector/promises";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { colorFromCode, statusTypeFromCode, type ColorType, type StatusType } from "../type.ts";
import { statusStyle } from "../style.ts";
import { apiClient } from "@/lib/api-client.ts";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export async function action(args: Route.ActionArgs) {
  console.log(args);
}

export async function loader({ context }: Route.LoaderArgs) {
  const response = await apiClient.incidents.$get();
	return await response.json();
}
export default function ({ loaderData }: Route.ComponentProps) {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-row items-stretch h-svh">
      {/* incident list + filter*/}
      <div className="flex flex-col gap-y-2 min-w-xs w-1/4 max-w-sm border-r py-4">
        {/* header */}
        <div className="px-3">
          <h1 className="font-semibold text-lg">Incidents</h1>
          <div className="py-3">
            <Filter />
          </div>
        </div>
        <ul className="flex flex-col gap-y-2 h-full px-3">
          {loaderData.incidents.map((inc) => {
            const isActive = pathname.startsWith(`/incident/${inc.id}`);
            return (
              <li key={inc.id}>
                <Link className="flex flex-row gap-x-2" to={href("/incident/:incidentId", { incidentId: inc.id })}>
                  <Card {...inc} status={inc.latestStatus} isActive={isActive} />
                </Link>
              </li>
            );
          })}
        </ul>
        {/*Pagenation */}
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}

function Card({
  title,
  summary,
  status,
  isActive,
}: {
  title: string;
  summary: string;
  status: { type: StatusType; color: ColorType };
  isActive: boolean;
}) {
  const circleStyle = statusStyle(status.color).circle?.bg;
  const isUnresolved = status.type !== "CLOSED";
  const bg = isActive ? "bg-slate-100 border-slate-400/50" : "bg-white";
  return (
    <div className={`flex flex-col rounded shadow-xs p-3 border gap-y-2 w-full ${bg}`}>
      <div className="flex flex-row items-start justify-between grow">
        <div className="flex flex-row gap-x-1 items-center">
          <h3 className="text-sm font-semibold">{title}</h3>
          {isUnresolved && circleStyle && <i className={`w-2 h-2 rounded-full ${circleStyle}`}></i>}
        </div>
        <time className="text-xs text-muted-foreground">3時間前</time>
      </div>
      <div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{summary}</p>
      </div>
    </div>
  );
}
