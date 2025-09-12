import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	route("/login", "routes/login/login.route.tsx"),
	layout("routes/base.layout.tsx", [
		index("routes/dashboard/dashboard.route.tsx"),
  	route("/incident/:incidentId/", "routes/incident/show/incident.show.route.tsx", [
			route("edit", "routes/incident/update/incident.update.route.tsx")
		]),
		
	])
] satisfies RouteConfig;
