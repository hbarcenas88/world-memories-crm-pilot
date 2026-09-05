import { describe, expect, it } from 'vitest';
import { calculateCommissionAmounts, expectedCommissionDueOn, projectedCommissionAmount } from '../../src/domain/commission';
import { markCommissionPaid } from '../../src/application/use-cases/markCommissionPaid';
import { createCommissionForServiceProvider } from '../../src/application/use-cases/createCommissionForServiceProvider';
import { enableCommissionForServiceProvider } from '../../src/application/use-cases/enableCommissionForServiceProvider';
import { recordServiceProviderCancellation } from '../../src/application/use-cases/recordServiceProviderCancellation';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('commission rules', () => {
  it('caps an expected commission due date at 90 days after the trip ends', () => {
    expect(expectedCommissionDueOn('2026-12-15', 120)).toBe('2027-03-15');
    expect(expectedCommissionDueOn('2026-12-15', 45)).toBe('2027-01-29');
  });

  it('uses the Provider snapshot rate without any manual exchange rate', () => {
    expect(projectedCommissionAmount({ amount: 1000, currency: 'USD' }, 0.8)).toEqual({ amount: 800, currency: 'USD' });
    expect(projectedCommissionAmount({ amount: 1000, currency: 'USD' }, 1)).toEqual({ amount: 1000, currency: 'USD' });
  });

  it('calculates the 80/100 expected amount from either a fixed rate or a variable gross amount', () => {
    expect(calculateCommissionAmounts({ saleAmount: { amount: 1000, currency: 'USD' }, grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.12, commissionRate: 0.8 })).toEqual({ gross: { amount: 120, currency: 'USD' }, expected: { amount: 96, currency: 'USD' } });
    expect(calculateCommissionAmounts({ grossCommissionMode: 'variable_amount_per_service', variableGrossAmount: { amount: 100, currency: 'MXN' }, commissionRate: 1 })).toEqual({ gross: { amount: 100, currency: 'MXN' }, expected: { amount: 100, currency: 'MXN' } });
  });

  it('requires explicit confirmation when the received amount differs from expected', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-26T00:00:00.000Z' });

    await expect(markCommissionPaid(repository, { commissionId: 'commission-1', paidOn: '2026-08-30', received: { amount: 90, currency: 'USD' }, occurredAt: '2026-08-30T12:00:00.000Z', recordedAt: '2026-08-30T12:01:00.000Z' }))
      .rejects.toThrow('commission payment difference requires confirmation');

    const result = await markCommissionPaid(repository, { commissionId: 'commission-1', paidOn: '2026-08-30', received: { amount: 90, currency: 'USD' }, confirmDifference: true, occurredAt: '2026-08-30T12:00:00.000Z', recordedAt: '2026-08-30T12:01:00.000Z' });
    expect(result).toMatchObject({ status: 'paid', received: { amount: 90, currency: 'USD' }, paidOn: '2026-08-30' });
  });

  it('creates a fixed-rate commission snapshot for one Provider component and never creates one for Sin comisión', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-26T00:00:00.000Z', clientId: 'client-1', tripId: 'trip-1' });
    await repository.seedClient({ id: 'client-1', name: 'Familia', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-26T00:00:00.000Z', effectiveEndOn: '2026-12-15' });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], commissionRate: 0.8, grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.12, commissionDueDays: 45, createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', saleAmount: 1000, commissionStatus: 'with_commission', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-2', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', saleAmount: 1000, commissionStatus: 'without_commission', createdAt: '2026-08-26T00:00:00.000Z' });

    const commission = await createCommissionForServiceProvider(repository, { serviceProviderId: 'component-1', occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });
    const none = await createCommissionForServiceProvider(repository, { serviceProviderId: 'component-2', occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(commission).toMatchObject({ serviceProviderId: 'component-1', expected: { amount: 96, currency: 'USD' }, dueOn: '2027-01-29' });
    expect(none).toBeUndefined();
  });

  it('converts Sin comisión to Con comisión atomically and never duplicates its commission', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-26T00:00:00.000Z', clientId: 'client-1', tripId: 'trip-1' });
    await repository.seedClient({ id: 'client-1', name: 'Familia', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], commissionRate: 0.8, grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.1, createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', saleAmount: 1000, commissionStatus: 'without_commission', createdAt: '2026-08-26T00:00:00.000Z' });

    const first = await enableCommissionForServiceProvider(repository, { serviceProviderId: 'component-1', occurredAt: '2026-08-27T12:00:00.000Z', recordedAt: '2026-08-27T12:00:00.000Z' });
    const second = await enableCommissionForServiceProvider(repository, { serviceProviderId: 'component-1', occurredAt: '2026-08-27T12:01:00.000Z', recordedAt: '2026-08-27T12:01:00.000Z' });

    expect(await repository.getServiceProvider('component-1')).toMatchObject({ commissionStatus: 'with_commission' });
    expect(first).toMatchObject({ serviceProviderId: 'component-1', expected: { amount: 80, currency: 'USD' } });
    expect(second?.id).toBe(first?.id);
    expect((await repository.snapshot()).commissions).toHaveLength(1);
  });

  it('records a component cancellation only with an explicit commission outcome', async () => {
    const now = '2026-08-26T00:00:00.000Z';
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Ana', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: now });
    await repository.seedClient({ id: 'client-1', name: 'Ana', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', serviceProviderId: 'component-1', expected: { amount: 80, currency: 'USD' }, status: 'expected', createdAt: now });

    await recordServiceProviderCancellation(repository, { serviceProviderId: 'component-1', cancellationOutcome: 'partial', commissionOutcome: 'cancel', occurredAt: '2026-09-03T12:00:00.000Z', recordedAt: '2026-09-03T12:00:00.000Z' });

    expect(await repository.getServiceProvider('component-1')).toMatchObject({ cancellationOutcome: 'partial', cancelledAt: '2026-09-03T12:00:00.000Z' });
    expect(await repository.getCommission('commission-1')).toMatchObject({ status: 'cancelled' });
    expect((await repository.snapshot()).events.map((event) => event.type)).toContain('service_provider_cancellation_recorded');
  });
});
