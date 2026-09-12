import type { ArchiveFilter } from '../../design/components/ArchiveFilterChips';

/** Applies the record-visibility choice without allowing operator precedence to hide active records. */
export function matchesArchive(record: object, filter: ArchiveFilter): boolean {
  if (filter === 'all') return true;
  const archivedAt = 'archivedAt' in record ? record.archivedAt : undefined;
  return filter === 'archived' ? Boolean(archivedAt) : !archivedAt;
}
