import type { Mutation } from "@/type.ts";

export type Incident = {
	id: string;
	code: string;
	title: string;
	summary: string;
	declaredAt: Date;
	latestStatus: {
		id: string;
	};
	tenantId: string;
};

export const Incident = {
	updateTitle: function (inc: Incident, title: string): Mutation<Incident> {
		if (inc.title === title) {
			return { diff: false, outcome: inc };
		}
		return { diff: true, outcome: { ...inc, title } };
	},
	updateSummary: function (inc: Incident, summary: string): Mutation<Incident> {
		if (inc.summary === summary) {
			return { diff: false, outcome: inc };
		}
		return { diff: true, outcome: { ...inc, summary } };
	},
};
