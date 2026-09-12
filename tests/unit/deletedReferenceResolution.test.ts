import { describe, expect, it } from 'vitest';
import { resolveRecordReference } from '../../src/domain/recordReference';

describe('resolveRecordReference', () => {
  it('distinguishes a live record, a deliberate historical reference, and invalid missing data', () => {
    expect(resolveRecordReference([{ id: 'lead-live', name: 'Consulta activa' }], [], 'lead', 'lead-live')).toMatchObject({ state: 'live', record: { name: 'Consulta activa' } });
    expect(resolveRecordReference([], [{ key: 'lead:lead-deleted', kind: 'lead', id: 'lead-deleted', displayLabel: 'Consulta histórica', deletedAt: '2026-09-05T12:00:00.000Z', eventDisposition: 'kept' }], 'lead', 'lead-deleted')).toMatchObject({ state: 'deleted', reference: { displayLabel: 'Consulta histórica' } });
    expect(resolveRecordReference([], [], 'lead', 'absent')).toEqual({ state: 'missing' });
  });
});
