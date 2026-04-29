import type { Incident } from "./incident.model.js";

export interface IncidentRepository {
	resolve(id: string): PromiseLike<Incident | undefined>
	store(incident: Incident): PromiseLike<void>
}
