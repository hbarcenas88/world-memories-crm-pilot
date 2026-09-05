import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { archiveRecord } from '../../src/application/use-cases/archiveRecord';
import { deleteRecord } from '../../src/application/use-cases/deleteRecord';
import { DexieWorkspaceRepository } from '../../src/infrastructure/db/repositories';
import { WorldMemoriesDb } from '../../src/infrastructure/db/worldMemoriesDb';

describe('record lifecycle persistence', () => {
  let db: WorldMemoriesDb;

  beforeEach(async () => {
    db = new WorldMemoriesDb(`wm-lifecycle-${crypto.randomUUID()}`);
    await db.open();
  });

  it('uses the archivedAt schema version and persists archive plus event atomically', async () => {
    expect(db.verno).toBe(13);
    const repository = new DexieWorkspaceRepository(db);
    await db.leads.put({
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

    await expect(db.leads.get('lead-1')).resolves.toMatchObject({ archivedAt: '2026-08-29T10:00:00.000Z' });
    await expect(db.activityEvents.where('aggregateId').equals('lead-1').toArray()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'record_archived' }),
    ]));
  });

  it('upgrades a v10 workspace without adding archive dates to existing records', async () => {
    const name = `wm-lifecycle-v10-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(10).stores({ leads: 'id,status,createdAt,clientId,tripId' });
    await legacy.open();
    await legacy.table('leads').put({
      id: 'lead-legacy',
      name: 'Consulta anterior',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      createdAt: '2026-08-01T00:00:00.000Z',
    });
    legacy.close();

    const upgraded = new WorldMemoriesDb(name);
    await upgraded.open();

    expect(upgraded.verno).toBe(13);
    expect(await upgraded.leads.get('lead-legacy')).not.toHaveProperty('archivedAt');
  });

  it('upgrades a v11 workspace to v13 additively, preserving linked records and adding new stores', async () => {
    const name = `wm-lifecycle-v11-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(11).stores({
      leads: 'id,status,createdAt,clientId,tripId,archivedAt', clients: 'id,createdAt,lastSavedAt,archivedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt,archivedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt,archivedAt', providers: 'id,status,createdAt,archivedAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt,archivedAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt,archivedAt', payments: 'id,tripId,status,occurredAt,recordedAt,archivedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt', backupDownloads: 'id,kind,downloadedAt',
    });
    await legacy.open();
    await legacy.table('clients').put({ id: 'client-legacy', name: 'Familia anterior', createdAt: '2026-08-01T00:00:00.000Z' });
    await legacy.table('leads').put({ id: 'lead-legacy', name: 'Consulta anterior', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-legacy', tripId: 'trip-legacy', createdAt: '2026-08-01T00:00:00.000Z' });
    await legacy.table('trips').put({ id: 'trip-legacy', leadId: 'lead-legacy', clientId: 'client-legacy', status: 'active', createdAt: '2026-08-01T00:00:00.000Z' });
    await legacy.table('providers').put({ id: 'provider-legacy', name: 'Proveedor anterior', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-01T00:00:00.000Z' });
    await legacy.table('services').put({ id: 'service-legacy', tripId: 'trip-legacy', name: 'Hotel', status: 'active', createdAt: '2026-08-01T00:00:00.000Z' });
    await legacy.table('serviceProviders').put({ id: 'component-legacy', serviceId: 'service-legacy', providerId: 'provider-legacy', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-08-01T00:00:00.000Z' });
    legacy.close();

    const upgraded = new WorldMemoriesDb(name);
    await upgraded.open();

    expect(upgraded.verno).toBe(13);
    expect(upgraded.tables.map((table) => table.name)).toEqual(expect.arrayContaining(['configurations', 'serviceAdditionalItems']));
    await expect(upgraded.trips.get('trip-legacy')).resolves.toMatchObject({ leadId: 'lead-legacy', clientId: 'client-legacy' });
    await expect(upgraded.serviceProviders.get('component-legacy')).resolves.toMatchObject({ serviceId: 'service-legacy', providerId: 'provider-legacy' });
  });

  it('rolls back the archive marker when its activity event cannot be saved', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.leads.put({
      id: 'lead-rollback',
      name: 'Consulta de prueba',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      createdAt: '2026-08-29T08:00:00.000Z',
    });
    db.activityEvents.hook('creating', (_key, event) => {
      if (event.type === 'record_archived') throw new Error('archive event persistence failed');
    });

    await expect(archiveRecord(repository, {
      kind: 'lead',
      id: 'lead-rollback',
      occurredAt: '2026-08-29T10:00:00.000Z',
      recordedAt: '2026-08-29T10:00:05.000Z',
    })).rejects.toThrow('archive event persistence failed');

    expect(await db.leads.get('lead-rollback')).not.toHaveProperty('archivedAt');
  });

  it('refuses deletion with relationships and preserves the complete IndexedDB state', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.clients.put({ id: 'client-1', name: 'Familia de prueba', createdAt: '2026-08-29T08:00:00.000Z' });
    await db.leads.put({
      id: 'lead-linked',
      name: 'Consulta relacionada',
      acquisitionSource: 'Web',
      requestedDateStatus: 'dates_to_define',
      status: 'contacted',
      clientId: 'client-1',
      createdAt: '2026-08-29T08:00:00.000Z',
    });

    await expect(deleteRecord(repository, { kind: 'client', id: 'client-1' })).rejects.toThrow('record has dependent relationships');

    await expect(db.clients.get('client-1')).resolves.toMatchObject({ name: 'Familia de prueba' });
    await expect(db.leads.get('lead-linked')).resolves.toMatchObject({ clientId: 'client-1' });
  });
});
