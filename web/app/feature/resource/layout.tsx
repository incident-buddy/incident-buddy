import { Outlet } from "react-router";

export const handle = {
  pageName: "リソース",
};

export default function Page() {
  return (
    <>
      <Outlet />
    </>
  );
}
