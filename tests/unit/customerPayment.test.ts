import { describe, expect, it } from 'vitest';
import { correctCustomerPayment } from '../../src/application/use-cases/correctCustomerPayment';
import { recordCustomerPayment } from '../../src/application/use-cases/recordCustomerPayment';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('recordCustomerPayment', () => {
  it('records a confirmed payment without changing the original conversion payment', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });
    const payment = await recordCustomerPayment(repository, { tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 200, currency: 'USD' }, occurredAt: now, recordedAt: now });
    expect(payment).toMatchObject({ tripId: 'trip-1', serviceProviderId: 'component-1', source: 'customer_payment' });
  });

  it('rejects a payment when its provider component does not exist', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await expect(recordCustomerPayment(repository, { tripId: 'trip-1', serviceProviderId: 'missing', amount: { amount: 200, currency: 'USD' }, occurredAt: now, recordedAt: now })).rejects.toThrow('service provider not found');
  });

  it('corrects a saved payment atomically and keeps an auditable before-and-after event', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });
    await repository.seedPayment({ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 200, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: now, status: 'received', source: 'customer_payment' });

    await correctCustomerPayment(repository, { paymentId: 'payment-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-21T12:00:00.000Z', recordedAt: now });

    expect((await repository.snapshot()).payments).toContainEqual(expect.objectContaining({ id: 'payment-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-21T12:00:00.000Z' }));
    expect((await repository.snapshot()).events).toContainEqual(expect.objectContaining({ aggregateType: 'payment', aggregateId: 'payment-1', type: 'customer_payment_corrected', payload: expect.objectContaining({ previousAmount: 200, amount: 250, previousOccurredAt: '2026-08-20T12:00:00.000Z', occurredAt: '2026-08-21T12:00:00.000Z' }) }));
  });
});
