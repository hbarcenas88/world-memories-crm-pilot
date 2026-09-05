import { createLead as createLeadModel } from '../../domain/lead';
import type { LeadDraft } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

export async function createLead(repository: WorkspaceRepository, command: { draft: LeadDraft; occurredAt: string; recordedAt: string }) {
  const result = createLeadModel(command.draft, command.occurredAt);
  const events = result.events.map((event) => ({ ...event, recordedAt: command.recordedAt }));

  await repository.transact(async (tx) => {
    await tx.putLead(result.lead);
    await tx.putEvents(events);
  });

  return { lead: result.lead, events };
}
