import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/app": {};
  "/app/incidents": {};
  "/app/workflows": {};
  "/app/workflows/:id": {
    "id": string;
  };
};