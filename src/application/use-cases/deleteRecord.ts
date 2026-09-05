import type { WorkspaceRepository } from '../ports';
import type { ManagedRecordRef } from '../recordImpact';

export async function deleteRecord(repository: WorkspaceRepository, target: ManagedRecordRef): Promise<void> {
  await repository.transact(async (transaction) => {
    const impact = await transaction.getRecordImpact(target);
    if (!impact.canDelete) throw new Error('record has dependent relationships');
    await transaction.deleteRecord(target);
  });
}
