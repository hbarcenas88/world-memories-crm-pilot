import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorldMemoriesDb } from '../../src/infrastructure/db/worldMemoriesDb';
import { DexieWorkspaceRepository } from '../../src/infrastructure/db/repositories';
import { convertLead } from '../../src/application/use-cases/convertLead';
import { createManualTask } from '../../src/application/use-cases/manualTask';

describe('WorldMemoriesDb transactions', () => {
  let db: WorldMemoriesDb;

  beforeEach(async () => {
    db = new WorldMemoriesDb(`wm-test-${crypto.randomUUID()}`);
    await db.open();
  });

  it('rolls back the lead when its activity event cannot be persisted', async () => {
    await expect(
      db.saveLeadWithEvents(
        { id: 'lead-1', name: 'María', status: 'new', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' },
        [{ id: 'event-1', aggregateType: 'lead', aggregateId: 'lead-1', type: '', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }],
      ),
    ).rejects.toThrow('activity event type is required');

    await expect(db.leads.get('lead-1')).resolves.toBeUndefined();
  });

  it('rolls back every entity when a transaction cannot persist an event', async () => {
    const repository = new DexieWorkspaceRepository(db);

    await expect(repository.transact(async (tx) => {
      await tx.putLead({ id: 'lead-1', name: 'Cliente de prueba', status: 'review_adjustments', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
      await tx.putClient({ id: 'client-1', name: 'María', createdAt: '2026-08-25T12:00:00.000Z' });
      await tx.putTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-25T12:00:00.000Z' });
      await tx.putEvents([{ id: 'event-1', aggregateType: 'trip', aggregateId: 'trip-1', type: '', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }]);
    })).rejects.toThrow('activity event type is required');

    await expect(db.clients.get('client-1')).resolves.toBeUndefined();
    await expect(db.trips.get('trip-1')).resolves.toBeUndefined();
    await expect(db.activityEvents.get('event-1')).resolves.toBeUndefined();
  });
  it('rejects orphaned relations instead of persisting a trip without its Lead', async () => {
    const repository = new DexieWorkspaceRepository(db);

    await expect(repository.transact((tx) => tx.putTrip({ id: 'trip-1', leadId: 'missing-lead', clientId: 'missing-client', status: 'active', createdAt: '2026-08-25T12:00:00.000Z' })))
      .rejects.toThrow('trip lead not found');
    await expect(db.trips.get('trip-1')).resolves.toBeUndefined();
  });

  it('rejects an activity event whose aggregate does not exist', async () => {
    const repository = new DexieWorkspaceRepository(db);

    await expect(repository.transact((tx) => tx.putEvents([{ id: 'event-1', aggregateType: 'lead', aggregateId: 'missing-lead', type: 'lead_updated', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }])))
      .rejects.toThrow('activity event aggregate not found');
    await expect(db.activityEvents.get('event-1')).resolves.toBeUndefined();
  });

  it('rolls back Lead, Client, Trip and Payment if a conversion event cannot persist', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.leads.put({ id: 'lead-1', name: 'Cliente de prueba', status: 'review_adjustments', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    db.activityEvents.hook('creating', (_primaryKey, event) => {
      if (event.type === 'payment_recorded') throw new Error('event persistence failed');
    });

    await expect(convertLead(repository, { leadId: 'lead-1', firstPayment: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:01:00.000Z' }))
      .rejects.toThrow('event persistence failed');

    await expect(db.leads.get('lead-1')).resolves.toMatchObject({ status: 'review_adjustments' });
    await expect(db.clients.toArray()).resolves.toEqual([]);
    await expect(db.trips.toArray()).resolves.toEqual([]);
    await expect(db.payments.toArray()).resolves.toEqual([]);
  });

  it('lists provider components for a Service through the workspace contract', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.providers.put({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-25T12:00:00.000Z' });
    await repository.transact(async (tx) => {
      await tx.putLead({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
      await tx.putClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: '2026-08-25T12:00:00.000Z' });
      await tx.putTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-25T12:00:00.000Z' });
      await tx.putService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-25T12:00:00.000Z' });
      await tx.putServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', saleAmount: 900, commissionStatus: 'with_commission', createdAt: '2026-08-25T12:00:00.000Z' });
    });

    await expect(repository.listServiceProvidersForService('service-1')).resolves.toMatchObject([{ id: 'component-1', saleAmount: 900 }]);
  });

  it('keeps a manual task and its audit event after IndexedDB reopens', async () => {
    const name = `wm-manual-task-${crypto.randomUUID()}`;
    const first = new WorldMemoriesDb(name);
    await first.open();
    const firstRepository = new DexieWorkspaceRepository(first);
    await first.leads.put({ id: 'lead-1', name: 'Consulta de prueba', status: 'contacted', createdAt: '2026-09-01T08:00:00.000Z', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define' });

    const created = await createManualTask(firstRepository, {
      title: 'Confirmar itinerario',
      dueOn: '2026-09-15',
      dueTime: '14:30',
      required: true,
      leadId: 'lead-1',
      occurredAt: '2026-09-01T09:00:00.000Z',
      recordedAt: '2026-09-01T09:00:00.000Z',
    });
    first.close();

    const reopened = new WorldMemoriesDb(name);
    await reopened.open();
    const reopenedRepository = new DexieWorkspaceRepository(reopened);
    await expect(reopenedRepository.getTask(created.task.id)).resolves.toMatchObject({ title: 'Confirmar itinerario', dueOn: '2026-09-15', dueTime: '14:30', required: true, leadId: 'lead-1', source: 'manual' });
    await expect(reopenedRepository.listEventsForAggregate(created.task.id)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'task_created_manually' })]));
    reopened.close();
    await reopened.delete();
  });

  it('permits a manual task linked only to an existing Commission', async () => {
    const repository = new DexieWorkspaceRepository(db);
    await db.providers.put({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-09-01T08:00:00.000Z' });
    await db.leads.put({ id: 'lead-1', name: 'Consulta de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: '2026-09-01T08:00:00.000Z', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define' });
    await db.clients.put({ id: 'client-1', name: 'Cliente de prueba', createdAt: '2026-09-01T08:00:00.000Z' });
    await db.trips.put({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-09-01T08:00:00.000Z' });
    await db.commissions.put({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, status: 'expected', createdAt: '2026-09-01T08:00:00.000Z' });

    const created = await createManualTask(repository, {
      title: 'Revisar comisión',
      dueOn: '2026-09-15',
      required: false,
      commissionId: 'commission-1',
      occurredAt: '2026-09-01T09:00:00.000Z',
      recordedAt: '2026-09-01T09:00:00.000Z',
    });

    expect(created.task).toMatchObject({ commissionId: 'commission-1' });
    expect(created.task).not.toHaveProperty('tripId');
  });
});
