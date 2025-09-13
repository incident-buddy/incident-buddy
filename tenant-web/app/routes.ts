import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	route("/login", "routes/login/login.route.tsx"),
	layout("routes/base.layout.tsx", [
		route("/incident/", "routes/dashboard/dashboard.route.tsx"),
		route("/incident/:incidentId/", "routes/incident/show/incident.show.route.tsx", [
			route("edit", "routes/incident/update/incident.update.route.tsx"),
			route("edit-summary", "routes/incident/update/incident.update-summary.route.tsx"),
		]),
		route("/task", "routes/task/list/task.list.route.tsx"),
		route("/setting", "routes/setting/show/setting.show.route.tsx"),
	]),
] satisfies RouteConfig;
