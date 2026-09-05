import { describe, expect, it } from 'vitest';
import { createSuggestedProviderTasks } from '../../src/application/use-cases/createSuggestedProviderTasks';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('createSuggestedProviderTasks', () => {
  it('creates only the explicitly selected Provider-template tasks for the Trip', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia Cruz', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: now, clientId: 'client-1', tripId: 'trip-1' });
    await repository.seedClient({ id: 'client-1', name: 'Familia Cruz', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });

    const result = await createSuggestedProviderTasks(repository, {
      tripId: 'trip-1',
      serviceProviderId: 'component-1',
      selectedTemplates: [{ templateId: 'template-1', title: 'Confirmar habitación', required: true }],
      occurredAt: now,
      recordedAt: now,
    });

    expect(result.tasks).toHaveLength(1);
    await expect(repository.listTasksForTrip('trip-1')).resolves.toEqual([expect.objectContaining({ title: 'Confirmar habitación', required: true, tripId: 'trip-1', serviceProviderId: 'component-1', templateId: 'template-1' })]);
  });

  it('preserves the template snapshot and its calculated due date on the created task', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Familia Cruz', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: now, clientId: 'client-1', tripId: 'trip-1' });
    await repository.seedClient({ id: 'client-1', name: 'Familia Cruz', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-10', createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedServiceProvider({ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: now });

    const result = await createSuggestedProviderTasks(repository, { tripId: 'trip-1', serviceProviderId: 'component-1', selectedTemplates: [{ templateId: 'template-1', title: 'Confirmar habitación', required: true, dueOn: '2026-09-08', templateSnapshot: { title: 'Confirmar habitación', required: true, relativeTo: 'trip_start', offsetDays: -2 } }], occurredAt: now, recordedAt: now });

    expect(result.tasks[0]).toMatchObject({ source: 'provider_template', dueDateSource: 'template', dueOn: '2026-09-08', templateSnapshot: { relativeTo: 'trip_start', offsetDays: -2 } });
  });
});
