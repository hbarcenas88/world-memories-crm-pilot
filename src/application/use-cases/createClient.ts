import { createActivityEvent } from '../../domain/events';
import type { Client, ClientDraft } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

export type CreateClientCommand = Readonly<{
  draft: ClientDraft;
  occurredAt: string;
  recordedAt: string;
}>;

export async function createClient(
  repository: WorkspaceRepository,
  command: CreateClientCommand,
): Promise<{ client: Client; event: ReturnType<typeof createActivityEvent> }> {
  return repository.transact(async (transaction) => {
    const client: Client = {
      ...command.draft,
      id: crypto.randomUUID(),
      createdAt: command.occurredAt,
      lastSavedAt: command.occurredAt,
    };
    const event = createActivityEvent({
      aggregateType: 'client',
      aggregateId: client.id,
      type: 'client_created',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: {},
    });
    await transaction.putClient(client);
    await transaction.putEvents([event]);
    return { client, event };
  });
}
