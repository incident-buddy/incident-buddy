import { createConnectTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { IncidentService } from "../../gen/proto/incidentbuddy/incident/v1/incident_pb";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});

export const incidentClient = createClient(IncidentService, transport);
