import { memberRepository } from "../member/member.repository.js";
import type { CreateIncidentParams, Incident } from "./incident.model.js";
import { AlreadyResolvedError } from "./incident.model.js";
import { incidentRepository } from "./incident.repository.js";

export const incidentService = {
  async create(params: CreateIncidentParams): Promise<Incident> {
    await memberRepository.upsert(params.createdBy, params.createdByName);
    return incidentRepository.create({
      ...params,
      slackMessageTs: "",
      teamIds: [],
      serviceIds: [],
      responders: [],
    });
  },

  async findById(id: string): Promise<Incident | null> {
    return incidentRepository.findById(id);
  },

  async findByChannelId(channelId: string): Promise<Incident | null> {
    return incidentRepository.findByChannelId(channelId);
  },

  async addResponder(
    incidentId: string,
    roleId: string,
    userId: string,
    userName: string,
  ): Promise<Incident> {
    await memberRepository.upsert(userId, userName);
    const responder = { roleId, userId, userName };
    const updated = await incidentRepository.addResponder(incidentId, responder);
    await incidentRepository.addTimelineEvent(incidentId, {
      type: "responder_added",
      actorId: userId,
      actorName: userName,
      note: `${userName} が ${roleId} になりました`,
      occurredAt: new Date(),
    });
    return updated;
  },

  async resolve(
    incidentId: string,
    userId: string,
    userName: string,
    note?: string,
  ): Promise<Incident> {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new Error(`Incident not found: ${incidentId}`);
    if (incident.status === "resolved") throw new AlreadyResolvedError();

    const resolvedAt = new Date();
    await incidentRepository.resolve(incidentId, resolvedAt, userId, userName);
    await incidentRepository.addTimelineEvent(incidentId, {
      type: "resolved",
      actorId: userId,
      actorName: userName,
      note: note ?? "",
      occurredAt: resolvedAt,
    });

    const updated = await incidentRepository.findById(incidentId);
    if (!updated) throw new Error(`Incident not found after resolve: ${incidentId}`);
    return updated;
  },
};
