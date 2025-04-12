import { Outlet } from "react-router";

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
