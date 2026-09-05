import { describe, expect, it } from 'vitest';
import { cancelTrip } from '../../src/application/use-cases/cancelTrip';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-09-05T12:00:00.000Z';

describe('cancelTrip', () => {
  it('records a cancellation without deleting the Trip, payments, components or Commission history', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Familia prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', serviceProviderId: 'component-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: now });
    await repository.seedPayment({ id: 'payment-1', tripId: 'trip-1', amount: { amount: 1000, currency: 'USD' }, source: 'customer_payment', status: 'received', occurredAt: now, recordedAt: now });

    await expect(cancelTrip(repository, { tripId: 'trip-1', occurredAt: now, recordedAt: now })).resolves.toMatchObject({ status: 'cancelled' });
    await expect(repository.getTrip('trip-1')).resolves.toMatchObject({ status: 'cancelled' });
    await expect(repository.listServicesForTrip('trip-1')).resolves.toHaveLength(1);
    await expect(repository.listPaymentsForTrip('trip-1')).resolves.toHaveLength(1);
    await expect(repository.getCommission('commission-1')).resolves.toMatchObject({ status: 'expected' });
    await expect(repository.listEventsForAggregate('trip-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'trip_cancelled' })]));
  });
});
