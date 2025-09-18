import type { ConnectRouter } from "@connectrpc/connect";
import { AssignmentService } from "@pb/api/incident/v1/assignment_pb.ts";
import { IncidentService } from "@pb/api/incident/v1/incident_pb.ts";
import { incidentService } from "src/services/incident/incident.service.ts";
import { assignmentService } from "./services/incident/assignment.service.ts";

export default (router: ConnectRouter) => {
	router.service(IncidentService, incidentService);
	router.service(AssignmentService, assignmentService);
};
