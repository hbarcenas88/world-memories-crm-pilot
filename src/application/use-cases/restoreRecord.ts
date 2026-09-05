import { createActivityEvent } from '../../domain/events';
import type { WorkspaceRepository } from '../ports';
import type { ManagedRecordRef } from '../recordImpact';
import { setArchivedAt } from './archiveRecord';

export type RestoreRecordCommand = Readonly<ManagedRecordRef & {
  occurredAt: string;
  recordedAt: string;
}>;

export async function restoreRecord(repository: WorkspaceRepository, command: RestoreRecordCommand): Promise<void> {
  await repository.transact(async (transaction) => {
    await setArchivedAt(transaction, command, undefined);
    await transaction.putEvents([createActivityEvent({
      aggregateType: command.kind,
      aggregateId: command.id,
      type: 'record_restored',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
    })]);
  });
}
