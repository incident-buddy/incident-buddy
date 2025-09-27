import type { IncidentRepository } from "./incident.repository.ts";

export class IncidentService {
	constructor(private repository: IncidentRepository) {}

	async listAssignments() {
		const incidents = await this.repository.listIncidents();
		return { incidents };
	}

	async fetchAssignment(args: { id: string }) {
		const incident = await this.repository.fetchIncident(args);
		return { incident };
	}

	async listAssignmentSlots(args: { id: string }) {
		const slots = await this.repository.listAssignmentSlots(args);
		return { slots };
	}
}
