import type { Incident } from "shared/types/incident";
import type { Mutation } from "@/type.ts";

export function updateTitle(inc: Incident, title: string): Mutation<Incident> {
	if (inc.title === title) {
		return { diff: false, outcome: inc };
	}
	return { diff: true, outcome: { ...inc, title } };
}

export function updateSummary(
	inc: Incident,
	summary: string,
): Mutation<Incident> {
	if (inc.summary === summary) {
		return { diff: false, outcome: inc };
	}
	return { diff: true, outcome: { ...inc, summary } };
}
