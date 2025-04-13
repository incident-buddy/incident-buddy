import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  layout("routes/base.layout.tsx", [
    index("routes/index.tsx"),
    ...prefix("incidents", [
      layout("routes/incidents.layout.tsx", [
        route("", "routes/incidents.index.tsx"),
        //        route(":id", "routes/incidents.detail.tsx"),
      ]),
    ]),
    ...prefix("workflows", [
      layout("routes/workflows.layout.tsx", [
        index("routes/workflows.index.tsx"),
        route(":id", "routes/workflows.detail.tsx"),
      ]),
    ]),
    ...prefix("resources", [
      layout("feature/resource-master/layout.tsx", [
        index("feature/resource-master/index.tsx"),
        route("create", "feature/resource-master/create.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
