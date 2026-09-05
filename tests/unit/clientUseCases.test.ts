import { describe, expect, it } from 'vitest';
import { updateClient } from '../../src/application/use-cases/updateClient';
import { createClient } from '../../src/application/use-cases/createClient';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('Client use cases', () => {
  it('creates an independent client with contact and residence details atomically', async () => {
    const repository = new MemoryWorkspaceRepository();

    const result = await createClient(repository, {
      draft: {
        name: 'Familia Morales',
        familyNote: 'Prefiere habitaciones comunicadas',
        residenceCountry: 'Panamá',
        phone: '+507 6000-0000',
        email: 'familia@example.test',
      },
      occurredAt: '2026-09-04T09:00:00.000Z',
      recordedAt: '2026-09-04T09:00:00.000Z',
    });

    expect(result.client).toMatchObject({
      name: 'Familia Morales',
      residenceCountry: 'Panamá',
      phone: '+507 6000-0000',
      email: 'familia@example.test',
    });
    expect(result.event).toMatchObject({ aggregateType: 'client', aggregateId: result.client.id, type: 'client_created' });
    await expect(repository.getClient(result.client.id)).resolves.toMatchObject({ name: 'Familia Morales' });
  });

  it('updates family details without changing its members and records the correction', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-1', name: 'Familia Rivera', familyNote: 'Prefiere suites', createdAt: '2026-08-20T00:00:00.000Z', members: [{ id: 'member-1', name: 'Lucía', status: 'active' }] });

    const result = await updateClient(repository, {
      clientId: 'client-1',
      draft: { name: 'Familia López', familyNote: 'Prefiere hoteles boutique' },
      occurredAt: '2026-08-29T12:00:00.000Z',
      recordedAt: '2026-08-29T12:05:00.000Z',
    });

    expect(result.client).toMatchObject({ id: 'client-1', name: 'Familia López', familyNote: 'Prefiere hoteles boutique', members: [{ id: 'member-1', name: 'Lucía', status: 'active' }] });
    expect(result.event).toMatchObject({ aggregateType: 'client', aggregateId: 'client-1', type: 'client_updated', occurredAt: '2026-08-29T12:00:00.000Z', recordedAt: '2026-08-29T12:05:00.000Z' });
    await expect(repository.getClient('client-1')).resolves.toMatchObject({ name: 'Familia López', members: [{ id: 'member-1', name: 'Lucía', status: 'active' }] });
  });
});
