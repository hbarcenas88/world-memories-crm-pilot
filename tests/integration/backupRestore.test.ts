import { describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { exportBackup, readBackup, restoreBackup } from '../../src/infrastructure/export/jsonBackup';
import type { WorkspaceSnapshot } from '../../src/application/workspaceSnapshot';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';
import { createDefaultWorkspaceConfiguration } from '../../src/domain/workspaceConfiguration';
import { WorldMemoriesDb } from '../../src/infrastructure/db/worldMemoriesDb';
import { DexieWorkspaceRepository } from '../../src/infrastructure/db/repositories';

const snapshot: WorkspaceSnapshot = {
  schemaVersion: 3,
  exportedAt: '2026-08-27T12:00:00.000Z',
  configuration: { ...createDefaultWorkspaceConfiguration('2026-08-27T12:00:00.000Z'), locale: 'en', catalogs: { ...createDefaultWorkspaceConfiguration().catalogs, communicationChannels: [{ id: 'channel-1', label: 'WhatsApp', active: true }] } },
  leads: [{ id: 'lead-restored', name: 'Familia respaldo', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }],
  clients: [{ id: 'client-restored', name: 'Familia respaldo', address: 'Calle respaldo 1', createdAt: '2026-08-20T00:00:00.000Z' }],
  trips: [{ id: 'trip-restored', leadId: 'lead-restored', clientId: 'client-restored', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-12-10', referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18.45, referenceExchangeRateLockedAt: '2026-08-20T12:00:00.000Z' }],
  services: [{ id: 'service-restored', tripId: 'trip-restored', name: 'Hotel', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
  serviceProviders: [{ id: 'component-restored', serviceId: 'service-restored', providerId: 'provider-restored', currency: 'USD', saleAmount: 1200, reservationLocator: 'WM-12345', commissionStatus: 'with_commission', cancellationOutcome: 'partial', cancelledAt: '2026-08-20T13:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' }],
  serviceAdditionalItems: [{ id: 'item-restored', serviceId: 'service-restored', label: 'Seguro', amount: 80, currency: 'USD', createdAt: '2026-08-20T00:00:00.000Z' }],
  providers: [{ id: 'provider-restored', name: 'Proveedor respaldo', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' }],
  providerTaskTemplates: [], commissions: [{ id: 'commission-restored', tripId: 'trip-restored', providerId: 'provider-restored', serviceProviderId: 'component-restored', expected: { amount: 100, currency: 'USD' }, projectionRateBaseCurrency: 'USD', projectionRateQuoteCurrency: 'MXN', projectionExchangeRate: 19, projectionRateSource: 'commission_override', projectedReferenceAmount: { amount: 1900, currency: 'MXN' }, status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }], notes: [], tasks: [{ id: 'task-restored', title: 'Seguimiento manual', required: false, dueOn: '2026-08-21', dueTime: '09:30', commissionId: 'commission-restored', source: 'manual', dueDateSource: 'manual', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }], payments: [], events: [], deletedRecordReferences: [],
};

describe('JSON backup and restore', () => {
  it('exports and restores operational monetary decimals as numbers, never formatted text', async () => {
    const monetarySnapshot: WorkspaceSnapshot = {
      ...snapshot,
      serviceProviders: [{ ...snapshot.serviceProviders[0], saleAmount: 1234.5, variableGrossCommissionAmount: 98.76 }],
      serviceAdditionalItems: [{ ...snapshot.serviceAdditionalItems[0], amount: 12.34 }],
      commissions: [{ ...snapshot.commissions[0], expected: { amount: 345.67, currency: 'USD' }, received: { amount: 123.45, currency: 'USD' } }],
      payments: [{ id: 'payment-restored', tripId: 'trip-restored', serviceProviderId: 'component-restored', amount: { amount: 300.2, currency: 'USD' }, occurredAt: '2026-08-20T00:00:00.000Z', recordedAt: '2026-08-20T00:00:00.000Z', status: 'received', source: 'customer_payment' }],
    };

    const blob = await exportBackup(monetarySnapshot);
    const envelope = JSON.parse(await blob.text()) as { snapshot: WorkspaceSnapshot };
    expect(envelope.snapshot.serviceProviders[0]).toMatchObject({ saleAmount: 1234.5, variableGrossCommissionAmount: 98.76 });
    expect(typeof envelope.snapshot.serviceProviders[0].saleAmount).toBe('number');
    expect(envelope.snapshot.serviceAdditionalItems[0].amount).toBe(12.34);
    expect(envelope.snapshot.commissions[0].received).toEqual({ amount: 123.45, currency: 'USD' });
    expect(envelope.snapshot.payments[0].amount).toEqual({ amount: 300.2, currency: 'USD' });

    const repository = new MemoryWorkspaceRepository();
    await restoreBackup(new File([blob], 'money.json', { type: 'application/json' }), repository);

    await expect(repository.snapshot()).resolves.toMatchObject({
      serviceProviders: [expect.objectContaining({ saleAmount: 1234.5, variableGrossCommissionAmount: 98.76 })],
      serviceAdditionalItems: [expect.objectContaining({ amount: 12.34 })],
      commissions: [expect.objectContaining({ expected: { amount: 345.67, currency: 'USD' }, received: { amount: 123.45, currency: 'USD' } })],
      payments: [expect.objectContaining({ amount: { amount: 300.2, currency: 'USD' } })],
    });
  });

  it('preserves new ISO country selections and historical contact text through IndexedDB and JSON', async () => {
    const source = new WorldMemoriesDb(`wm-contact-roundtrip-${crypto.randomUUID()}`);
    await source.open();
    const sourceRepository = new DexieWorkspaceRepository(source);
    await source.leads.bulkPut([
      { id: 'lead-new-contact', name: 'Contacto nuevo', status: 'contacted', createdAt: '2026-09-11T12:00:00.000Z', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', residenceCountry: 'MX', phone: '+50760000000' },
      { id: 'lead-historic-contact', name: 'Contacto histórico', status: 'contacted', createdAt: '2026-09-11T12:00:00.000Z', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', residenceCountry: 'Panamá', phone: '6000-0000' },
    ]);
    const backup = await exportBackup(await sourceRepository.snapshot());
    const restored = new WorldMemoriesDb(`wm-contact-restore-${crypto.randomUUID()}`);
    await restored.open();
    await restoreBackup(new File([backup], 'contacts.json', { type: 'application/json' }), new DexieWorkspaceRepository(restored));

    await expect(restored.leads.orderBy('id').toArray()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'lead-new-contact', residenceCountry: 'MX', phone: '+50760000000' }),
      expect.objectContaining({ id: 'lead-historic-contact', residenceCountry: 'Panamá', phone: '6000-0000' }),
    ]));
    source.close(); restored.close(); await source.delete(); await restored.delete();
  });

  it('upgrades a checksummed schema 1 backup additively before restoring it', async () => {
    const legacySnapshot = { schemaVersion: 1 as const, exportedAt: snapshot.exportedAt, leads: snapshot.leads, clients: snapshot.clients, trips: snapshot.trips, services: snapshot.services, serviceProviders: snapshot.serviceProviders, providers: snapshot.providers, providerTaskTemplates: snapshot.providerTaskTemplates, commissions: snapshot.commissions, notes: snapshot.notes, tasks: snapshot.tasks, payments: snapshot.payments, events: snapshot.events };
    const serializedSnapshot = JSON.stringify(legacySnapshot);
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializedSnapshot))), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const file = new File([JSON.stringify({ format: 'world-memories-backup', schemaVersion: 1, checksum, snapshot: legacySnapshot })], 'legacy.json', { type: 'application/json' });

    await expect(readBackup(file)).resolves.toMatchObject({ schemaVersion: 3, snapshot: { schemaVersion: 3, serviceAdditionalItems: [], deletedRecordReferences: [], configuration: { locale: 'es' } } });
  });

  it('upgrades a checksummed schema 2 backup without rewriting its captured records', async () => {
    const legacySnapshot = { ...snapshot, schemaVersion: 2 as const };
    Reflect.deleteProperty(legacySnapshot, 'deletedRecordReferences');
    const serializedSnapshot = JSON.stringify(legacySnapshot);
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializedSnapshot))), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const file = new File([JSON.stringify({ format: 'world-memories-backup', schemaVersion: 2, checksum, snapshot: legacySnapshot })], 'legacy-v2.json', { type: 'application/json' });

    await expect(readBackup(file)).resolves.toMatchObject({ schemaVersion: 3, snapshot: { leads: snapshot.leads, deletedRecordReferences: [] } });
  });

  it('exports a versioned, checksummed snapshot and restores it atomically', async () => {
    const blob = await exportBackup(snapshot);
    const file = new File([blob], 'world-memories-backup-2026-08-27T120000Z.json', { type: 'application/json' });
    await expect(readBackup(file)).resolves.toMatchObject({ schemaVersion: 3, counts: { leads: 1, serviceAdditionalItems: 1, deletedRecordReferences: 0 } });

    const repository = new MemoryWorkspaceRepository();
    await restoreBackup(file, repository);

    await expect(repository.snapshot()).resolves.toMatchObject({ configuration: snapshot.configuration, clients: snapshot.clients, trips: snapshot.trips, serviceProviders: snapshot.serviceProviders, commissions: snapshot.commissions, tasks: snapshot.tasks, serviceAdditionalItems: snapshot.serviceAdditionalItems });
  });

  it('replaces a valid backup through the IndexedDB repository without leaving restoration pending', async () => {
    const db = new WorldMemoriesDb(`wm-backup-restore-${crypto.randomUUID()}`);
    await db.open();
    const repository = new DexieWorkspaceRepository(db);
    await db.leads.put({ id: 'lead-indexeddb', name: 'Familia IndexedDB', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-09-07T12:00:00.000Z' });
    const current = await repository.snapshot();

    await repository.replaceSnapshot(current);

    await expect(repository.listLeads()).resolves.toEqual([expect.objectContaining({ id: 'lead-indexeddb', name: 'Familia IndexedDB' })]);
    db.close();
    await db.delete();
  });

  it('rejects a corrupted backup without changing the existing workspace', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-current', name: 'Familia actual', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' });
    const invalidFile = new File([JSON.stringify({ format: 'world-memories-backup', schemaVersion: 1, snapshot, checksum: 'not-a-real-checksum' })], 'invalid.json', { type: 'application/json' });

    await expect(restoreBackup(invalidFile, repository)).rejects.toThrow('checksum');
    await expect(repository.listLeads()).resolves.toEqual([{ id: 'lead-current', name: 'Familia actual', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }]);
  });

  it('rejects a task that references a missing commission before a backup can be restored', async () => {
    const invalidSnapshot: WorkspaceSnapshot = {
      ...snapshot,
      tasks: [{ id: 'task-orphan', title: 'Revisar comisión', required: false, status: 'open', commissionId: 'commission-missing', createdAt: '2026-08-20T00:00:00.000Z' }],
    };

    await expect(exportBackup(invalidSnapshot)).rejects.toThrow('orphaned task relationship');
  });
});
