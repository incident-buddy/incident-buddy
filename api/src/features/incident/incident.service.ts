import { memberRepository } from "../member/member.repository.js";
import type { CreateIncidentParams, Incident } from "./incident.model.js";
import { incidentRepository } from "./incident.repository.js";

export const incidentService = {
  async create(params: CreateIncidentParams): Promise<Incident> {
    await memberRepository.upsert(params.createdBy, params.createdByName);
    return incidentRepository.create({
      ...params,
      slackMessageTs: "",
      teamIds: [],
      serviceIds: [],
      responderIds: [],
    });
  },
};
