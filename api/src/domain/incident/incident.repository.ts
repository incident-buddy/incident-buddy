import type { Incident } from "@src/domain/incident/incident.model";

export interface IncidentRepository {
  resolve(id: string): PromiseLike<Incident | undefined>;
  store(incident: Incident): PromiseLike<void>;
}
