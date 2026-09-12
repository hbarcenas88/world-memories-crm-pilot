import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { archiveRecord } from '../../src/application/use-cases/archiveRecord';
import { deleteRecord } from '../../src/application/use-cases/deleteRecord';
import { saveTripWorkspace } from '../../src/application/use-cases/saveTripWorkspace';
import { DexieWorkspaceRepository } from '../../src/infrastructure/db/repositories';
import { WorldMemoriesDb } from '../../src/infrastructure/db/worldMemoriesDb';

describe('record lifecycle persistence', () => {
  let db: WorldMemoriesDb;

  beforeEach(async () => {
    db = new WorldMemoriesDb(`wm-lifecycle-${crypto.randomUUID()}`);
    await db.open();
  });

  it('uses the archivedAt schema version and persists archive plus event atomically', async () => {
    expect(db.verno).toBe(15);
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

    expect(upgraded.verno).toBe(15);
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

    expect(upgraded.verno).toBe(15);
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

  it('allows an informed deletion with relationships while preserving those related records', async () => {
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

    await deleteRecord(repository, { kind: 'client', id: 'client-1' });

    await expect(db.clients.get('client-1')).resolves.toBeUndefined();
    await expect(db.leads.get('lead-linked')).resolves.toMatchObject({ clientId: 'client-1' });
    await expect(db.deletedRecordReferences.get('client:client-1')).resolves.toMatchObject({ kind: 'client', id: 'client-1', displayLabel: 'Familia de prueba' });
  });

  it('persists a surviving Trip after its Client was deliberately deleted without recreating that Client', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.clients.put({ id: 'client-historical', name: 'Familia eliminada', createdAt: '2026-09-07T10:00:00.000Z' });
    await db.leads.put({ id: 'lead-historical', name: 'Consulta histórica', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-historical', tripId: 'trip-historical', createdAt: '2026-09-07T10:00:00.000Z' });
    await db.trips.put({ id: 'trip-historical', leadId: 'lead-historical', clientId: 'client-historical', status: 'active', createdAt: '2026-09-07T10:00:00.000Z' });
    await deleteRecord(repository, { kind: 'client', id: 'client-historical' });

    await saveTripWorkspace(repository, {
      trip: { id: 'trip-historical', leadId: 'lead-historical', clientId: 'client-historical', status: 'active', overrideStartOn: '2026-10-15', createdAt: '2026-09-07T10:00:00.000Z' },
      services: [], notes: [], occurredAt: '2026-09-07T11:00:00.000Z', recordedAt: '2026-09-07T11:00:00.000Z',
    });

    await expect(db.trips.get('trip-historical')).resolves.toMatchObject({ overrideStartOn: '2026-10-15' });
    await expect(db.clients.get('client-historical')).resolves.toBeUndefined();
    await expect(db.deletedRecordReferences.get('client:client-historical')).resolves.toBeDefined();
  });

  it('allows related survivors to be updated when their deliberately deleted parent is represented historically', async () => {
    const repository = new DexieWorkspaceRepository(db);
    const createdAt = '2026-09-07T10:00:00.000Z';
    await db.clients.put({ id: 'client-survivor', name: 'Familia histórica', createdAt });
    await db.leads.put({ id: 'lead-survivor', name: 'Consulta histórica', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-survivor', tripId: 'trip-survivor', createdAt });
    await db.trips.put({ id: 'trip-survivor', leadId: 'lead-survivor', clientId: 'client-survivor', status: 'active', createdAt });
    await db.services.put({ id: 'service-survivor', tripId: 'trip-survivor', name: 'Hotel histórico', status: 'active', createdAt });
    await db.providers.put({ id: 'provider-survivor', name: 'Proveedor histórico', status: 'active', allowedCurrencies: ['USD'], createdAt });
    await db.serviceProviders.put({ id: 'component-survivor', serviceId: 'service-survivor', providerId: 'provider-survivor', currency: 'USD', commissionStatus: 'with_commission', createdAt });
    await db.serviceAdditionalItems.put({ id: 'additional-survivor', serviceId: 'service-survivor', label: 'Traslado', amount: 20, currency: 'USD', createdAt });
    await db.providerTaskTemplates.put({ id: 'template-survivor', providerId: 'provider-survivor', title: 'Confirmar', required: false, relativeTo: 'manual', active: true, createdAt });
    await db.commissions.put({ id: 'commission-survivor', tripId: 'trip-survivor', providerId: 'provider-survivor', serviceProviderId: 'component-survivor', expected: { amount: 10, currency: 'USD' }, status: 'expected', createdAt });
    await db.payments.put({ id: 'payment-survivor', tripId: 'trip-survivor', serviceProviderId: 'component-survivor', amount: { amount: 20, currency: 'USD' }, occurredAt: createdAt, recordedAt: createdAt, status: 'received', source: 'customer_payment' });
    await db.tasks.put({ id: 'task-survivor', title: 'Confirmar historial', required: false, tripId: 'trip-survivor', commissionId: 'commission-survivor', serviceProviderId: 'component-survivor', status: 'open', createdAt });
    await db.notes.put({ id: 'note-survivor', ownerType: 'trip', ownerId: 'trip-survivor', content: 'Nota histórica', updatedAt: createdAt });

    await deleteRecord(repository, { kind: 'client', id: 'client-survivor' });
    await deleteRecord(repository, { kind: 'trip', id: 'trip-survivor' });
    await deleteRecord(repository, { kind: 'provider', id: 'provider-survivor' });

    await repository.transact(async (tx) => {
      await tx.putLead({ id: 'lead-survivor', name: 'Consulta histórica actualizada', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-survivor', tripId: 'trip-survivor', createdAt });
      await tx.putService({ id: 'service-survivor', tripId: 'trip-survivor', name: 'Hotel histórico actualizado', status: 'active', createdAt });
      await tx.putProviderTaskTemplate({ id: 'template-survivor', providerId: 'provider-survivor', title: 'Confirmar actualizado', required: false, relativeTo: 'manual', active: true, createdAt });
      await tx.putNote({ id: 'note-survivor', ownerType: 'trip', ownerId: 'trip-survivor', content: 'Nota histórica actualizada', updatedAt: '2026-09-07T11:00:00.000Z' });
      await tx.putServiceProvider({ id: 'component-survivor', serviceId: 'service-survivor', providerId: 'provider-survivor', currency: 'USD', commissionStatus: 'with_commission', customerBalanceDueOn: '2026-10-01', createdAt });
      await tx.putServiceAdditionalItem({ id: 'additional-survivor', serviceId: 'service-survivor', label: 'Traslado actualizado', amount: 20, currency: 'USD', createdAt });
      await tx.putCommission({ id: 'commission-survivor', tripId: 'trip-survivor', providerId: 'provider-survivor', serviceProviderId: 'component-survivor', expected: { amount: 12, currency: 'USD' }, status: 'expected', createdAt });
      await tx.putPayment({ id: 'payment-survivor', tripId: 'trip-survivor', serviceProviderId: 'component-survivor', amount: { amount: 20, currency: 'USD' }, occurredAt: createdAt, recordedAt: '2026-09-07T11:00:00.000Z', status: 'received', source: 'customer_payment' });
      await tx.putTask({ id: 'task-survivor', title: 'Confirmar historial actualizado', required: false, tripId: 'trip-survivor', commissionId: 'commission-survivor', serviceProviderId: 'component-survivor', status: 'open', createdAt });
    });

    await expect(db.leads.get('lead-survivor')).resolves.toMatchObject({ name: 'Consulta histórica actualizada' });
    await expect(db.services.get('service-survivor')).resolves.toMatchObject({ name: 'Hotel histórico actualizado' });
    await expect(db.commissions.get('commission-survivor')).resolves.toMatchObject({ expected: { amount: 12, currency: 'USD' } });
    await expect(db.tasks.get('task-survivor')).resolves.toMatchObject({ title: 'Confirmar historial actualizado' });
    await expect(db.clients.get('client-survivor')).resolves.toBeUndefined();
    await expect(db.trips.get('trip-survivor')).resolves.toBeUndefined();
    await expect(db.providers.get('provider-survivor')).resolves.toBeUndefined();
  });

  it('rolls back a deletion when its historical reference cannot be stored', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.clients.put({ id: 'client-rollback', name: 'Familia protegida', createdAt: '2026-08-29T08:00:00.000Z' });
    db.deletedRecordReferences.hook('creating', () => { throw new Error('deleted reference persistence failed'); });

    await expect(deleteRecord(repository, { kind: 'client', id: 'client-rollback' })).rejects.toThrow('deleted reference persistence failed');
    await expect(db.clients.get('client-rollback')).resolves.toMatchObject({ name: 'Familia protegida' });
    await expect(db.deletedRecordReferences.get('client:client-rollback')).resolves.toBeUndefined();
  });
});
