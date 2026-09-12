import type { DeletedRecordReference } from './types';

export type RecordReferenceResolution<T extends { id: string }> =
  | Readonly<{ state: 'live'; record: T }>
  | Readonly<{ state: 'deleted'; reference: DeletedRecordReference }>
  | Readonly<{ state: 'missing' }>;

/**
 * Resolves a relationship without turning a deliberate deletion into an absent record.
 * New selectors must only receive the live branch; callers may render the deleted branch
 * as historical context and must treat `missing` as an integrity error.
 */
export function resolveRecordReference<T extends { id: string }>(records: readonly T[], deletedReferences: readonly DeletedRecordReference[], kind: DeletedRecordReference['kind'], id: string | undefined): RecordReferenceResolution<T> {
  const record = records.find((item) => item.id === id);
  if (record) return { state: 'live', record };
  const reference = deletedReferences.find((item) => item.kind === kind && item.id === id);
  return reference ? { state: 'deleted', reference } : { state: 'missing' };
}
