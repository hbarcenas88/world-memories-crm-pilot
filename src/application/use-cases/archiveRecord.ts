import { createActivityEvent } from '../../domain/events';
import type { WorkspaceRepository, WorkspaceTransaction } from '../ports';
import type { ManagedRecordRef } from '../recordImpact';

export type ArchiveRecordCommand = Readonly<ManagedRecordRef & {
  occurredAt: string;
  recordedAt: string;
}>;

function withArchivedAt<T extends { archivedAt?: string }>(record: T, archivedAt: string | undefined): T {
  if (archivedAt) return { ...record, archivedAt };
  const restored = { ...record };
  delete restored.archivedAt;
  return restored;
}

export async function setArchivedAt(transaction: WorkspaceTransaction, target: ManagedRecordRef, archivedAt: string | undefined): Promise<void> {
  if (target.kind === 'lead') {
    const record = await transaction.getLead(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putLead(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'client') {
    const record = await transaction.getClient(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putClient(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'trip') {
    const record = await transaction.getTrip(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putTrip(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'provider') {
    const record = await transaction.getProvider(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putProvider(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'service') {
    const record = await transaction.getService(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putService(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'payment') {
    const record = await transaction.getPayment(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putPayment(withArchivedAt(record, archivedAt));
    return;
  }
  if (target.kind === 'commission') {
    const record = await transaction.getCommission(target.id);
    if (!record) throw new Error('managed record not found');
    await transaction.putCommission(withArchivedAt(record, archivedAt));
    return;
  }
  const record = await transaction.getTask(target.id);
  if (!record) throw new Error('managed record not found');
  await transaction.putTask(withArchivedAt(record, archivedAt));
}

export async function archiveRecord(repository: WorkspaceRepository, command: ArchiveRecordCommand): Promise<void> {
  await repository.transact(async (transaction) => {
    await setArchivedAt(transaction, command, command.occurredAt);
    await transaction.putEvents([createActivityEvent({
      aggregateType: command.kind,
      aggregateId: command.id,
      type: 'record_archived',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
    })]);
  });
}
