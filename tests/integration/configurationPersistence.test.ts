import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { DexieWorkspaceRepository } from '../../src/infrastructure/db/repositories';
import { WorldMemoriesDb } from '../../src/infrastructure/db/worldMemoriesDb';

describe('workspace configuration persistence', () => {
  const databases: WorldMemoriesDb[] = [];
  afterEach(async () => { await Promise.all(databases.splice(0).map((db) => db.delete())); });

  it('persists the selected interface language and catalog state across repository instances', async () => {
    const name = `wm-configuration-${crypto.randomUUID()}`;
    const first = new WorldMemoriesDb(name);
    databases.push(first);
    const firstRepository = new DexieWorkspaceRepository(first);
    const configuration = await firstRepository.getConfiguration();
    await firstRepository.saveConfiguration({
      ...configuration,
      locale: 'en',
      updatedAt: '2026-09-01T12:00:00.000Z',
      catalogs: {
        ...configuration.catalogs,
        travelTypes: [...configuration.catalogs.travelTypes, { id: 'travel-type-expedition', label: 'Expedition', active: true }],
      },
    });
    first.close();

    const second = new WorldMemoriesDb(name);
    databases.push(second);
    const secondRepository = new DexieWorkspaceRepository(second);
    await expect(secondRepository.getConfiguration()).resolves.toMatchObject({
      locale: 'en',
      catalogs: { travelTypes: expect.arrayContaining([expect.objectContaining({ id: 'travel-type-expedition', active: true })]) },
    });
  });
});
