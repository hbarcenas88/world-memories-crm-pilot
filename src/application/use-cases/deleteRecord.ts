import type { WorkspaceRepository } from '../ports';
import type { ManagedRecordRef, RecordDeleteOptions } from '../recordImpact';

/**
 * This operation is intentionally destructive only after the UI has shown the impact twice.
 * Related records stay intact, even when that leaves their reference historical/incongruent.
 */
export async function deleteRecord(repository: WorkspaceRepository, target: ManagedRecordRef, options: RecordDeleteOptions = {}): Promise<void> {
  await repository.transact(async (transaction) => {
    await transaction.getRecordImpact(target);
    await transaction.deleteRecord(target, options);
  });
}
