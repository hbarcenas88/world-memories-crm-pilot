import { describe, expect, it } from 'vitest';
import { updateCommissionTracking } from '../../src/application/use-cases/updateCommissionTracking';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('updateCommissionTracking', () => {
  it('saves a Tracking Form reference as a separate traceable commission action', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-26T00:00:00.000Z' });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-26T00:00:00.000Z' });

    const result = await updateCommissionTracking(repository, { commissionId: 'commission-1', trackingReference: 'TF-101', occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(result.trackingReference).toBe('TF-101');
    await expect(repository.listEventsForAggregate('commission-1')).resolves.toContainEqual(expect.objectContaining({ type: 'commission_tracking_updated' }));
  });
});
