import { Hono } from "hono";
import { IncidentRepository } from "./incident.repository.ts";
import { IncidentService } from "./incident.service.ts";
import { db } from "@/db/index.ts";

const app = new Hono();
const repo = new IncidentRepository(db);
const service = new IncidentService(repo);

app.get("/", async (c) => {
	const incidents = await service.listAssignments();
	return c.json(incidents);
});

app.get("/:id", async (c) => {
	const id = c.req.param("id");
	const incident = await service.fetchAssignment({ id });
	return c.json(incident);
});

app.get("/:id/assignment", async (c) => {
	const id = c.req.param("id");
	const assignments = await service.listAssignmentSlots({ id });
	return c.json(assignments);
});

export default app;
