import { describe, expect, it } from 'vitest';
import { exportBackup, readBackup, restoreBackup } from '../../src/infrastructure/export/jsonBackup';
import type { WorkspaceSnapshot } from '../../src/application/workspaceSnapshot';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';
import { createDefaultWorkspaceConfiguration } from '../../src/domain/workspaceConfiguration';

const snapshot: WorkspaceSnapshot = {
  schemaVersion: 2,
  exportedAt: '2026-08-27T12:00:00.000Z',
  configuration: { ...createDefaultWorkspaceConfiguration('2026-08-27T12:00:00.000Z'), locale: 'en', catalogs: { ...createDefaultWorkspaceConfiguration().catalogs, communicationChannels: [{ id: 'channel-1', label: 'WhatsApp', active: true }] } },
  leads: [{ id: 'lead-restored', name: 'Familia respaldo', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }],
  clients: [{ id: 'client-restored', name: 'Familia respaldo', address: 'Calle respaldo 1', createdAt: '2026-08-20T00:00:00.000Z' }],
  trips: [{ id: 'trip-restored', leadId: 'lead-restored', clientId: 'client-restored', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-12-10', referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18.45, referenceExchangeRateLockedAt: '2026-08-20T12:00:00.000Z' }],
  services: [{ id: 'service-restored', tripId: 'trip-restored', name: 'Hotel', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
  serviceProviders: [{ id: 'component-restored', serviceId: 'service-restored', providerId: 'provider-restored', currency: 'USD', saleAmount: 1200, reservationLocator: 'WM-12345', commissionStatus: 'with_commission', cancellationOutcome: 'partial', cancelledAt: '2026-08-20T13:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' }],
  serviceAdditionalItems: [{ id: 'item-restored', serviceId: 'service-restored', label: 'Seguro', amount: 80, currency: 'USD', createdAt: '2026-08-20T00:00:00.000Z' }],
  providers: [{ id: 'provider-restored', name: 'Proveedor respaldo', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' }],
  providerTaskTemplates: [], commissions: [{ id: 'commission-restored', tripId: 'trip-restored', providerId: 'provider-restored', serviceProviderId: 'component-restored', expected: { amount: 100, currency: 'USD' }, projectionRateBaseCurrency: 'USD', projectionRateQuoteCurrency: 'MXN', projectionExchangeRate: 19, projectionRateSource: 'commission_override', projectedReferenceAmount: { amount: 1900, currency: 'MXN' }, status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }], notes: [], tasks: [{ id: 'task-restored', title: 'Seguimiento manual', required: false, dueOn: '2026-08-21', dueTime: '09:30', commissionId: 'commission-restored', source: 'manual', dueDateSource: 'manual', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }], payments: [], events: [],
};

describe('JSON backup and restore', () => {
  it('upgrades a checksummed schema 1 backup additively before restoring it', async () => {
    const legacySnapshot = { schemaVersion: 1 as const, exportedAt: snapshot.exportedAt, leads: snapshot.leads, clients: snapshot.clients, trips: snapshot.trips, services: snapshot.services, serviceProviders: snapshot.serviceProviders, providers: snapshot.providers, providerTaskTemplates: snapshot.providerTaskTemplates, commissions: snapshot.commissions, notes: snapshot.notes, tasks: snapshot.tasks, payments: snapshot.payments, events: snapshot.events };
    const serializedSnapshot = JSON.stringify(legacySnapshot);
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializedSnapshot))), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const file = new File([JSON.stringify({ format: 'world-memories-backup', schemaVersion: 1, checksum, snapshot: legacySnapshot })], 'legacy.json', { type: 'application/json' });

    await expect(readBackup(file)).resolves.toMatchObject({ schemaVersion: 2, snapshot: { schemaVersion: 2, serviceAdditionalItems: [], configuration: { locale: 'es' } } });
  });

  it('exports a versioned, checksummed snapshot and restores it atomically', async () => {
    const blob = await exportBackup(snapshot);
    const file = new File([blob], 'world-memories-backup-2026-08-27T120000Z.json', { type: 'application/json' });
    await expect(readBackup(file)).resolves.toMatchObject({ schemaVersion: 2, counts: { leads: 1, serviceAdditionalItems: 1 } });

    const repository = new MemoryWorkspaceRepository();
    await restoreBackup(file, repository);

    await expect(repository.snapshot()).resolves.toMatchObject({ configuration: snapshot.configuration, clients: snapshot.clients, trips: snapshot.trips, serviceProviders: snapshot.serviceProviders, commissions: snapshot.commissions, tasks: snapshot.tasks, serviceAdditionalItems: snapshot.serviceAdditionalItems });
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
