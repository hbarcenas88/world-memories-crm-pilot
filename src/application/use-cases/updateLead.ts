import { createActivityEvent } from '../../domain/events';
import type { Lead, LeadDraft } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

export type UpdateLeadCommand = Readonly<{
  leadId: string;
  draft: LeadDraft;
  occurredAt: string;
  recordedAt: string;
}>;

function editableLead(current: Lead, draft: LeadDraft): Lead {
  const { initialStatus, ...editable } = draft;
  void initialStatus;
  return {
    ...editable,
    id: current.id,
    status: current.status,
    createdAt: current.createdAt,
    ...(current.clientId ? { clientId: current.clientId } : {}),
    ...(current.tripId ? { tripId: current.tripId } : {}),
    ...(current.archivedAt ? { archivedAt: current.archivedAt } : {}),
  };
}

export async function updateLead(repository: WorkspaceRepository, command: UpdateLeadCommand): Promise<{ lead: Lead; event: ReturnType<typeof createActivityEvent> }> {
  return repository.transact(async (transaction) => {
    const current = await transaction.getLead(command.leadId);
    if (!current) throw new Error('lead not found');
    const lead = editableLead(current, command.draft);
    const event = createActivityEvent({
      aggregateType: 'lead',
      aggregateId: lead.id,
      type: 'lead_updated',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: { changedFields: Object.keys(command.draft).filter((field) => field !== 'initialStatus') },
    });
    await transaction.putLead(lead);
    await transaction.putEvents([event]);
    return { lead, event };
  });
}
