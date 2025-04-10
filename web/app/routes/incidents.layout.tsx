import { Outlet } from "react-router";

export const handle = {
  pageName: "インシデント",
};

export default function Page() {
  return (
    <>
      <Outlet />
    </>
  );
}
