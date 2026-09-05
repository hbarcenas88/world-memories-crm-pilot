import { describe, expect, it } from 'vitest';
import { assignInitialPaymentToServiceProvider } from '../../src/application/use-cases/assignInitialPaymentToServiceProvider';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('assignInitialPaymentToServiceProvider', () => {
  it('assigns the original conversion payment to a matching component without creating another payment', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });
    await repository.seedPayment({ id: 'payment-1', tripId: 'trip-1', amount: { amount: 250, currency: 'USD' }, occurredAt: now, recordedAt: now, status: 'received', source: 'first_conversion_payment' });

    const payment = await assignInitialPaymentToServiceProvider(repository, { paymentId: 'payment-1', serviceProviderId: 'component-1', occurredAt: now, recordedAt: now });

    expect(payment).toMatchObject({ id: 'payment-1', source: 'first_conversion_payment', serviceProviderId: 'component-1' });
    await expect(repository.listPaymentsForTrip('trip-1')).resolves.toHaveLength(1);
  });

  it('rejects an assignment with a different component currency', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'MXN', commissionStatus: 'with_commission', createdAt: now });
    await repository.seedPayment({ id: 'payment-1', tripId: 'trip-1', amount: { amount: 250, currency: 'USD' }, occurredAt: now, recordedAt: now, status: 'received', source: 'first_conversion_payment' });

    await expect(assignInitialPaymentToServiceProvider(repository, { paymentId: 'payment-1', serviceProviderId: 'component-1', occurredAt: now, recordedAt: now })).rejects.toThrow('initial payment currency must match component currency');
  });
});
