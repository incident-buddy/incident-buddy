import {
  ClientLoaderFunctionArgs,
  Link,
  useLoaderData,
} from "@remix-run/react";
import { incidentClient } from "~/lib/connect-client";

export const handle = {
  pageName: "インシデント",
};

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  return await incidentClient.listIncidents({ page: 1 });
}

export default function Page() {
  const data = useLoaderData<typeof clientLoader>();
  return (
    <div className="flex h-screen items-center justify-center">
      {data.incidents.map((incident) => (
        <div
          key={incident.id}
          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex flex-col gap-1">
            {/* incident code and title with Link */}
            <Link
              to={`/incidents/${incident.id}`}
              className="text-lg font-semibold text-gray-800 dark:text-gray-100"
            >
              <span className="text-gray-600 dark:text-gray-300">
                {incident.code}
              </span>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {incident.title}
              </h2>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
