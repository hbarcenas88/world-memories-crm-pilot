import { createActivityEvent } from '../../domain/events';
import type { WorkspaceRepository } from '../ports';

export async function linkExistingClient(repository: WorkspaceRepository, command: { leadId: string; clientId: string; occurredAt: string; recordedAt: string }) {
  return repository.transact(async (tx) => {
    const [lead, client] = await Promise.all([tx.getLead(command.leadId), tx.getClient(command.clientId)]);
    if (!lead) throw new Error('lead not found');
    if (!client) throw new Error('client not found');
    if (lead.status === 'sold' || lead.tripId) throw new Error('sold lead client cannot be changed');

    const linkedLead = { ...lead, clientId: client.id };
    const event = createActivityEvent({
      aggregateType: 'lead',
      aggregateId: lead.id,
      type: 'lead_client_linked',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: { clientId: client.id },
    });
    await tx.putLead(linkedLead);
    await tx.putEvents([event]);
    return { lead: linkedLead, event };
  });
}
