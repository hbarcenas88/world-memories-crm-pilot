import { describe, expect, it } from 'vitest';
import { matchesArchive } from '../../src/features/records/archiveVisibility';

describe('matchesArchive', () => {
  const active = { id: 'active' };
  const archived = { id: 'archived', archivedAt: '2026-09-05T00:00:00.000Z' };

  it('keeps both active and archived records when the user asks for all records', () => {
    expect([active, archived].filter((record) => matchesArchive(record, 'all')).map((record) => record.id)).toEqual(['active', 'archived']);
  });

  it('keeps only the requested archive state for focused archive filters', () => {
    expect([active, archived].filter((record) => matchesArchive(record, 'active')).map((record) => record.id)).toEqual(['active']);
    expect([active, archived].filter((record) => matchesArchive(record, 'archived')).map((record) => record.id)).toEqual(['archived']);
  });
});
