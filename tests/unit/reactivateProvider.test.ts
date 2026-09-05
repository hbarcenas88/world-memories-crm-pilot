import { describe, expect, it } from 'vitest';
import { reactivateProvider } from '../../src/application/use-cases/reactivateProvider';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('reactivateProvider', () => {
  it('reactivates an inactive Provider explicitly and records the business event', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'inactive', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' });

    const provider = await reactivateProvider(repository, { providerId: 'provider-1', occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(provider.status).toBe('active');
    await expect(repository.listEventsForAggregate('provider-1')).resolves.toContainEqual(expect.objectContaining({ type: 'provider_reactivated' }));
  });
});
