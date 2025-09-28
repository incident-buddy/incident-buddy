import type { IncidentRepository } from "./incident.repository.ts";

export class IncidentService {
	constructor(private repository: IncidentRepository) {}

	async listIncidents() {
		const incidents = await this.repository.listIncidents();
		return { incidents };
	}

	async fetchAssignment(args: { id: string }) {
		const incident = await this.repository.fetchIncident(args);
		return { incident };
	}

	async listAssignments(args: { id: string }) {
		const assignments = await this.repository.listAssignments(args);
		return { assignments };
	}
}
