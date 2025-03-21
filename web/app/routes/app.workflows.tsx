import {Outlet} from "@remix-run/react";

export const handle = {
  pageName: "ワークフロー",
};

export default function Page() {
  return (
    <>
      <Outlet />
    </>
  );
}
