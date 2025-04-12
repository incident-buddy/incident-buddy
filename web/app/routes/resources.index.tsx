import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const { status, data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data } = await apiClient.GET("/resource");
      return data?.resources;
    },
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
  if (status === "error" || !resources) {
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
      <h1>{JSON.stringify(resources)}</h1>
    </>
  );
}
