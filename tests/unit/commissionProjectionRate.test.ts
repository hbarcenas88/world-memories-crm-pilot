import { describe, expect, it } from 'vitest';
import { updateCommissionProjectionRate } from '../../src/application/use-cases/updateCommissionProjectionRate';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-09-05T12:00:00.000Z';

describe('updateCommissionProjectionRate', () => {
  it('separates one Commission with an explicit rate override and restores its Trip-following rate explicitly', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Familia prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18.5 });
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: now, projectionRateBaseCurrency: 'USD', projectionRateQuoteCurrency: 'MXN', projectionExchangeRate: 18.5, projectionRateSource: 'trip_reference', projectedReferenceAmount: { amount: 1850, currency: 'MXN' } });

    await expect(updateCommissionProjectionRate(repository, { commissionId: 'commission-1', mode: 'override', baseCurrency: 'USD', quoteCurrency: 'MXN', exchangeRate: 19, occurredAt: now, recordedAt: now })).resolves.toMatchObject({
      projectionRateSource: 'commission_override',
      projectionExchangeRate: 19,
      projectedReferenceAmount: { amount: 1900, currency: 'MXN' },
    });
    await expect(repository.listEventsForAggregate('commission-1')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'commission_projection_rate_overridden', payload: expect.objectContaining({ previousRate: 18.5, nextRate: 19 }) }),
    ]));

    await expect(updateCommissionProjectionRate(repository, { commissionId: 'commission-1', mode: 'follow_trip', occurredAt: now, recordedAt: now })).resolves.toMatchObject({
      projectionRateSource: 'trip_reference',
      projectionExchangeRate: 18.5,
      projectedReferenceAmount: { amount: 1850, currency: 'MXN' },
    });
    await expect(repository.listEventsForAggregate('commission-1')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'commission_projection_rate_reverted_to_trip' }),
    ]));
  });

  it('rejects an incomplete or self-referential Commission rate before writing', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Familia prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: now });

    await expect(updateCommissionProjectionRate(repository, { commissionId: 'commission-1', mode: 'override', baseCurrency: 'USD', quoteCurrency: 'USD', exchangeRate: 1, occurredAt: now, recordedAt: now })).rejects.toThrow('commission projection currencies must differ');
    await expect(repository.getCommission('commission-1')).resolves.not.toHaveProperty('projectionRateSource');
  });
});
