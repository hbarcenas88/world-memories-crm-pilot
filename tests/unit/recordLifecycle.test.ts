import { describe, expect, it } from 'vitest';
import { archiveRecord } from '../../src/application/use-cases/archiveRecord';
import { deleteRecord } from '../../src/application/use-cases/deleteRecord';
import { restoreRecord } from '../../src/application/use-cases/restoreRecord';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('archiveRecord', () => {
  it('archives a record without deleting it or its relationship history', async () => {
    const repository = new MemoryWorkspaceRepository({
      id: 'lead-1',
      name: 'Consulta de prueba',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      createdAt: '2026-08-29T08:00:00.000Z',
    });

    await archiveRecord(repository, {
      kind: 'lead',
      id: 'lead-1',
      occurredAt: '2026-08-29T10:00:00.000Z',
      recordedAt: '2026-08-29T10:00:05.000Z',
    });

    await expect(repository.getLead('lead-1')).resolves.toMatchObject({
      id: 'lead-1',
      status: 'contacted',
      archivedAt: '2026-08-29T10:00:00.000Z',
    });
    expect((await repository.snapshot()).events).toEqual(expect.arrayContaining([
      expect.objectContaining({ aggregateType: 'lead', aggregateId: 'lead-1', type: 'record_archived' }),
    ]));
  });
});

describe('deleteRecord', () => {
  it('allows an informed deletion with relationships while retaining related records', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-1', name: 'Familia prueba', createdAt: '2026-08-29T08:00:00.000Z' });
    await repository.transact((transaction) => transaction.putLead({
      id: 'lead-1',
      name: 'Consulta de prueba',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      clientId: 'client-1',
      createdAt: '2026-08-29T08:05:00.000Z',
    }));

    await deleteRecord(repository, { kind: 'client', id: 'client-1' });

    await expect(repository.getClient('client-1')).resolves.toBeUndefined();
    await expect(repository.getLead('lead-1')).resolves.toMatchObject({ clientId: 'client-1' });
    expect((await repository.snapshot()).deletedRecordReferences).toEqual([
      expect.objectContaining({ key: 'client:client-1', kind: 'client', id: 'client-1', displayLabel: 'Familia prueba', eventDisposition: 'kept' }),
    ]);
  });

  it('removes only its own activity events when explicitly requested', async () => {
    const repository = new MemoryWorkspaceRepository({
      id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T08:00:00.000Z',
    });
    await repository.transact((transaction) => transaction.putEvents([{ id: 'event-1', aggregateType: 'lead', aggregateId: 'lead-1', type: 'lead_created', occurredAt: '2026-08-29T08:00:00.000Z', recordedAt: '2026-08-29T08:00:00.000Z', payload: {} }]));

    await deleteRecord(repository, { kind: 'lead', id: 'lead-1' }, { removeOwnEvents: true });

    expect((await repository.snapshot()).events).toHaveLength(0);
    expect((await repository.snapshot()).deletedRecordReferences).toEqual([
      expect.objectContaining({ key: 'lead:lead-1', eventDisposition: 'deleted' }),
    ]);
  });

  it('rejects a deletion confirmation when the displayed impact is stale', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T08:00:00.000Z' });
    const impact = await repository.transact((transaction) => transaction.getRecordImpact({ kind: 'lead', id: 'lead-1' }));
    await repository.transact((transaction) => transaction.putTask({ id: 'task-1', title: 'Seguimiento', required: false, status: 'open', leadId: 'lead-1', createdAt: '2026-08-29T08:01:00.000Z' }));

    await expect(deleteRecord(repository, { kind: 'lead', id: 'lead-1' }, { expectedFingerprint: impact.fingerprint })).rejects.toThrow('record impact changed');
    await expect(repository.getLead('lead-1')).resolves.toBeDefined();
  });

  it('does not let a direct write silently reuse an ID deliberately deleted from history', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T08:00:00.000Z' });
    await deleteRecord(repository, { kind: 'lead', id: 'lead-1' });

    await expect(repository.transact((transaction) => transaction.putLead({ id: 'lead-1', name: 'Consulta nueva', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T08:00:00.000Z' }))).rejects.toThrow('cannot be reused');
    await expect(repository.getLead('lead-1')).resolves.toBeUndefined();
  });
});

describe('restoreRecord', () => {
  it('removes only the archive marker and records the restoration', async () => {
    const repository = new MemoryWorkspaceRepository({
      id: 'lead-1',
      name: 'Consulta de prueba',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      archivedAt: '2026-08-29T10:00:00.000Z',
      createdAt: '2026-08-29T08:00:00.000Z',
    });

    await restoreRecord(repository, {
      kind: 'lead',
      id: 'lead-1',
      occurredAt: '2026-08-29T10:01:00.000Z',
      recordedAt: '2026-08-29T10:01:05.000Z',
    });

    const restored = await repository.getLead('lead-1');
    expect(restored).toMatchObject({ id: 'lead-1', status: 'contacted' });
    expect(restored).not.toHaveProperty('archivedAt');
    expect((await repository.snapshot()).events).toEqual(expect.arrayContaining([
      expect.objectContaining({ aggregateType: 'lead', aggregateId: 'lead-1', type: 'record_restored' }),
    ]));
  });
});
