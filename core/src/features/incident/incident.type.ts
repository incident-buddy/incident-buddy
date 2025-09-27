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

export type Assignment = {
	incidentId: string;
	/** インシデントに設けられたロールの枠ID */
	roleSlotId: string;
	role: {
		id: string;
		name: string;
		code: string;
		abbr: string;
		color: string;
	};
	/** ロールにアサインされたユーザー*/
	assignment:
		| {
				id: string;
				familyName: string;
				givenName: string;
				email: string;
		  }
		| undefined;
};
