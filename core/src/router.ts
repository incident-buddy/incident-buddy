import type { ConnectRouter } from "@connectrpc/connect";
import { IncidentService } from "@pb/api/incident/v1/incident_pb.ts";
import { incidentService } from "src/services/incident/incident.service.ts";

export default (router: ConnectRouter) => {
	router.service(IncidentService, incidentService);
};
