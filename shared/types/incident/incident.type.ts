import type { Color } from "../generic/color.type.ts";

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

export type Assignment = {
	incidentId: string;
	/** インシデントに設けられたロールの枠ID */
	roleSlotId: string;
	role: {
		id: string;
		name: string;
		code: string;
		abbr: string;
		color: Color;
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

const statusType = [
	"declared", // 発生
	"ongoing", // 対応中
	"converged", // 緩和中
	"closed", // 終了
];
export type StatusType = (typeof statusType)[number];
