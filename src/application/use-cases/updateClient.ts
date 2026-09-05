import { createActivityEvent } from '../../domain/events';
import type { Client, ClientDraft } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

export type UpdateClientCommand = Readonly<{
  clientId: string;
  draft: ClientDraft;
  occurredAt: string;
  recordedAt: string;
}>;

export async function updateClient(repository: WorkspaceRepository, command: UpdateClientCommand): Promise<{ client: Client; event: ReturnType<typeof createActivityEvent> }> {
  return repository.transact(async (transaction) => {
    const current = await transaction.getClient(command.clientId);
    if (!current) throw new Error('client not found');
    const client: Client = { ...current, ...command.draft, lastSavedAt: command.occurredAt };
    const event = createActivityEvent({
      aggregateType: 'client',
      aggregateId: client.id,
      type: 'client_updated',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: { changedFields: Object.keys(command.draft) },
    });
    await transaction.putClient(client);
    await transaction.putEvents([event]);
    return { client, event };
  });
}
