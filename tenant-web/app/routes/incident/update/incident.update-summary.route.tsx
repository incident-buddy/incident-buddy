import type { Route } from "./+types/incident.update-summary.route";
export async function action({ request }: Route.ActionArgs) {
  const json = await request.json();
  console.log(json);
}
