import { describe, expect, it } from 'vitest';
import { saveProviderTaskTemplate } from '../../src/application/use-cases/saveProviderTaskTemplate';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('saveProviderTaskTemplate', () => {
  it('creates an editable active template for an existing Provider', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: now });

    const template = await saveProviderTaskTemplate(repository, { providerId: 'provider-1', title: 'Solicitar confirmación', required: true, relativeTo: 'trip_start', offsetDays: -14, active: true, occurredAt: now, recordedAt: now });

    expect(template).toMatchObject({ providerId: 'provider-1', title: 'Solicitar confirmación', required: true, relativeTo: 'trip_start', offsetDays: -14, active: true });
    await expect(repository.listProviderTaskTemplates('provider-1')).resolves.toContainEqual(template);
  });

  it('rejects a template with no title before persisting it', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await expect(saveProviderTaskTemplate(repository, { providerId: 'provider-1', title: ' ', required: false, relativeTo: 'manual', active: true, occurredAt: now, recordedAt: now })).rejects.toThrow('provider task template title is required');
  });
});
