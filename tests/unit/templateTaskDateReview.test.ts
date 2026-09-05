import { describe, expect, it } from 'vitest';
import { resolveTemplateTaskDateReview } from '../../src/application/use-cases/resolveTemplateTaskDateReview';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-09-01T10:00:00.000Z';

async function repositoryWithReviewTask(): Promise<MemoryWorkspaceRepository> {
  const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now });
  await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
  await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-15', createdAt: now });
  await repository.seedTask({ id: 'task-1', title: 'Confirmar habitaci\u00f3n', required: true, tripId: 'trip-1', dueOn: '2026-09-09', status: 'open', source: 'provider_template', dueDateSource: 'manual', requiresManualDateReview: true, templateSnapshot: { title: 'Confirmar habitaci\u00f3n', required: true, relativeTo: 'trip_start', offsetDays: -2 }, createdAt: now });
  return repository;
}

describe('resolveTemplateTaskDateReview', () => {
  it('recalculates a reviewed date from the current Trip interval and records the decision', async () => {
    const repository = await repositoryWithReviewTask();

    await resolveTemplateTaskDateReview(repository, { taskId: 'task-1', decision: 'recalculate', occurredAt: now, recordedAt: now });

    await expect(repository.getTask('task-1')).resolves.toMatchObject({ dueOn: '2026-09-13', dueDateSource: 'template', requiresManualDateReview: false });
    await expect(repository.listEventsForAggregate('task-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'task_template_date_review_resolved', payload: { decision: 'recalculate', dueOn: '2026-09-13' } })]));
  });

  it('keeps a reviewed manual date only when the user chooses that option', async () => {
    const repository = await repositoryWithReviewTask();

    await resolveTemplateTaskDateReview(repository, { taskId: 'task-1', decision: 'keep_manual', occurredAt: now, recordedAt: now });

    await expect(repository.getTask('task-1')).resolves.toMatchObject({ dueOn: '2026-09-09', dueDateSource: 'manual', requiresManualDateReview: false });
  });
});
