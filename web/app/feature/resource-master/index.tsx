import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "es-toolkit";
import { Categories } from "./category";
import { useDictionary } from "@/translation";
import { toIcon } from "@/feature/resource-master/icon";
import { Link } from "react-router";
import { Button } from "@/component/ui/button";

export default function Page() {
  const dict = useDictionary().page.resource;
  const { status, data: masters } = useQuery({
    queryKey: ["resource-master"],
    queryFn: () =>
      apiClient
        .GET("/resource-master")
        .then((res) =>
          groupBy(res.data?.resourceMasters ?? [], (m) => m.category),
        ),
  });

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">Loading...</h3>
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">Error loading resources</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-6xl flex flex-col gap-y-6">
        <HeaderActions />
        {Categories.map((category) => (
          <div key={category} className="flex flex-col gap-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {dict.categories[category]}
            </h2>
            <ul className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(masters[category] ?? []).map((master) => (
                <li key={master.id} className="col-span-1 flex">
                  <Master master={{ ...master, count: 12 }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function HeaderActions() {
  const dict = useDictionary().page.resource;
  return (
    <div className="flex flex-row items-center justify-between">
      <h1 className="font-bold text-xl">{dict.pageTitle}</h1>
      <div>
        <Link to="create">
          <Button>{dict.addNewMaster}</Button>
        </Link>
      </div>
    </div>
  );
}

function Master(props: {
  master: {
    name: string;
    id: string;
    code: string;
    icon: string;
    count: number;
  };
}) {
  const { master } = props;
  return (
    <Link to="/resource/master" className="w-full">
      <div className="w-full flex flex-row gap-y-2 py-2 border rounded shadow-sm bg-white hover:bg-gray-50">
        <div className="flex items-start justify-center w-10">
          {toIcon(master.icon, "sm")}
        </div>
        <div className="flex flex-1 items-center justify-between truncate">
          <div className="flex-1 truncate">
            <div className="flex flex-row items-center justify-between pr-3">
              <h3 className="text-base">{master.name}</h3>
              <span className="py-0.5 px-1 text-gray-500 text-xs leading-none rounded bg-gray-100">
                {master.count}
              </span>
            </div>
            <p className="text-sm text-gray-500">{master.code}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
