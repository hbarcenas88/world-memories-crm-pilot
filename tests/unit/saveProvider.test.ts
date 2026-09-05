import { describe, expect, it } from 'vitest';
import { saveProvider } from '../../src/application/use-cases/saveProvider';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('saveProvider', () => {
  it('creates an active multimoneda Provider with its operational details and event', async () => {
    const repository = new MemoryWorkspaceRepository();
    const result = await saveProvider(repository, {
      name: 'Hotel Aurora',
      status: 'active',
      allowedCurrencies: ['USD', 'MXN'],
      contactName: 'Andrea',
      references: ['AUR-123'],
      serviceTypes: ['Hoteles'],
      occurredAt: '2026-08-26T12:00:00.000Z',
      recordedAt: '2026-08-26T12:00:00.000Z',
    });

    expect(result).toMatchObject({ name: 'Hotel Aurora', allowedCurrencies: ['USD', 'MXN'], contactName: 'Andrea', references: ['AUR-123'], serviceTypes: ['Hoteles'] });
    await expect(repository.listProviders()).resolves.toContainEqual(result);
    await expect(repository.listEventsForAggregate(result.id)).resolves.toContainEqual(expect.objectContaining({ aggregateType: 'provider', type: 'provider_created' }));
  });

  it('rejects a Provider with no selectable currency before persisting it', async () => {
    const repository = new MemoryWorkspaceRepository();
    await expect(saveProvider(repository, { name: 'Sin moneda', status: 'active', allowedCurrencies: [], occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' }))
      .rejects.toThrow('provider requires at least one allowed currency');
    await expect(repository.listProviders()).resolves.toEqual([]);
  });

  it('persists the agency share and fixed gross-commission rule owned by the Provider', async () => {
    const repository = new MemoryWorkspaceRepository();

    const result = await saveProvider(repository, {
      name: 'Parques del Mundo',
      status: 'active',
      allowedCurrencies: ['USD'],
      commissionRate: 1,
      grossCommissionMode: 'fixed_percentage',
      defaultGrossRate: 0.12,
      occurredAt: '2026-08-26T12:00:00.000Z',
      recordedAt: '2026-08-26T12:00:00.000Z',
    });

    expect(result).toMatchObject({ commissionRate: 1, grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.12 });
  });
});
