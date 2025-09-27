import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	route("/hoge", "routes/task/list/task.list.route.tsx"),
  route("/login", "routes/login/login.route.tsx"),
  layout("routes/base.layout.tsx", [
    route("/incident/", "routes/incident/list/incident.list.route.tsx", [
      route(":incidentId/", "routes/incident/show/incident.show.route.tsx", [
        index("routes/incident/show/todo/incident.show.todo.route.tsx"),
        route("timeline", "routes/incident/show/timeline/incident.show.timeline.route.tsx"),
        route("edit", "routes/incident/update/incident.update.route.tsx"),
        route("edit-summary", "routes/incident/update/incident.update-summary.route.tsx"),
        route("assign/:roleSlotId/", "routes/incident/assign/assign.route.tsx"),
      ]),
    ]),

    //route("/task", "routes/task/list/task.list.route.tsx"),
    route("/setting", "routes/setting/show/setting.show.route.tsx"),
  ]),
] satisfies RouteConfig;
