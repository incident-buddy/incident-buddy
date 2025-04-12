import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "es-toolkit";
import { Categories } from "./category";
import {useContext} from "react";
import {MessageContext} from "@/translation";
import {EllipsisVertical} from "lucide-react";

export default function Page() {
  const dict = useContext(MessageContext).dict.page.resource;
  const resourceQuery = useQuery({
    queryKey: ['resources'],
    queryFn: () => apiClient.GET("/resource").then((res) =>
      groupBy(res.data?.resources ?? [], (r) => r.category)
    ),
  });
  const masterQuery = useQuery({
    queryKey: ['resource-master'],
    queryFn: () => apiClient.GET("/resource-master").then((res) =>
      groupBy(res.data?.resourceMasters ?? [], (m) => m.category)
    ),
  });

  const pending = resourceQuery.isPending || masterQuery.isPending;
  const error = resourceQuery.isError || masterQuery.isError;

  if (pending) {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">Loading...</h3>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
        <div className="flex flex-row items-center justify-between">
          <h3 className="font-bold text-md">Error loading resources</h3>
        </div>
      </div>
    );
  }

  const masters = masterQuery.data;

  return (
    <>
      <div className="container max-w-6xl">
        <h1 className="scroll-m-20 font-semibold tracking-tight mb-4">
          Resource Masters
        </h1>
        {Categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold tracking-tight mb-4">{dict.categories[category]}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {masters[category].map((master) => (
                <li key={master.id} className="col-span-1 flex rounded-md shadow-sm">
                  <div className="flex w-16 shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white">
                    {master.name.slice(0, 2)}
                  </div>
                  <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                    <div className="flex-1 truncate px-4 py-2 text-sm">
                      <a href={master.id} className="font-medium text-gray-900 hover:text-gray-600">
                        {master.name}
                      </a>
                      <p className="text-gray-500">{master.code}</p>
                    </div>
                    <div className="shrink-0 pr-2">
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500 "
                      ><EllipsisVertical aria-hidden="true" className="size-5" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>
      <h1>Resources</h1>
      <pre>{JSON.stringify(resourceQuery.data, null, 2)}</pre>
      <pre>{JSON.stringify(masterQuery.data, null, 2)}</pre>
    </>
  );
}

/** Card element for resource master */
function ResourceMaster(props: {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  attributes: {
    code: string;
    name: string;
    isArray: boolean;
    valueType: string;
  }[];
}) {
  return (
    <div className="flex flex-col gap-y-2 rounded-sm border bg-card text-card-foreground p-4 bg-slate-50">
      <div className="flex flex-row items-center justify-between">
        <h3 className="font-bold text-md">{props.name}</h3>
        <p className="text-sm text-muted-foreground">{props.code}</p>
      </div>
      <p className="text-sm text-muted-foreground">{props.description}</p>
      <p className="text-sm text-muted-foreground">{props.category}</p>
      <ul>
        {props.attributes.map((attr) => (
          <li key={attr.code} className="flex flex-row items-center justify-between">
            <span>{attr.name}</span>
            <span>{attr.code}</span>
            <span>{attr.valueType}</span>
            <span>{attr.isArray ? "Array" : "Single"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}