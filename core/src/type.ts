export type Mutation<T> = {
	diff: boolean; // 変更前後に差があるか
	outcome: T;
};

export type User = {
	id: string;
	familyName: string;
	givenName: string;
	email: string | null;
};

export type IncidentRole = {
	id: string;
	name: string;
	code: string;
	color: string;
};
