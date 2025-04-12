import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/incidents": {};
  "/workflows": {};
  "/workflows/:id": {
    "id": string;
  };
  "/resources": {};
};
