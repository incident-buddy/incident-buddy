export type Msg = IncidentUpdatedMsg;
type IncidentUpdatedMsg = {
	type: "incident-updated";
	payload: { [key: string]: string };
};

export type SendResult = { ok: true } | { ok: false; message: string };
