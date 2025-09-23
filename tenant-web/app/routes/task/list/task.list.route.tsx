import { apiClient } from "src/lib/api-client";
import type { Route } from "./+types/task.list.route";

export const loader = async () => {
	const res = await apiClient.posts.$post({form: {title: "", body: ""}});
	if (!res) {
		return {ok: false, message: "oops"};
	}
	return await res.json();
}

export default function ({loaderData}: Route.ComponentProps) {
	
  return (
		<>
			<h1>tasks</h1>
			<p>{loaderData.message}</p>
		</>
	);
}
