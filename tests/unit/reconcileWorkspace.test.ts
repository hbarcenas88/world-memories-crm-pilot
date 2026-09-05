import { describe, expect, it } from 'vitest';
import { reconcileWorkspace } from '../../src/application/use-cases/reconcileWorkspace';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-09-01T10:00:00.000Z';

describe('reconcileWorkspace', () => {
  it('completes ended Trips and creates one follow-up task for an overdue expected Commission', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveEndOn: '2026-08-31', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, dueOn: '2026-08-31', status: 'expected', createdAt: now });

    await reconcileWorkspace(repository, { today: '2026-09-01', commissionFollowUpTitle: 'Dar seguimiento a comisión', occurredAt: now, recordedAt: now });
    await reconcileWorkspace(repository, { today: '2026-09-01', commissionFollowUpTitle: 'Dar seguimiento a comisión', occurredAt: now, recordedAt: now });

    await expect(repository.getTrip('trip-1')).resolves.toMatchObject({ status: 'completed' });
    await expect(repository.listTasksForTrip('trip-1')).resolves.toEqual([expect.objectContaining({ commissionId: 'commission-1', source: 'commission_follow_up', dueOn: '2026-08-31', title: 'Dar seguimiento a comisión' })]);
    await expect(repository.listEventsForAggregate('trip-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'trip_reconciled_completed' })]));
    await expect(repository.listEventsForAggregate('commission-follow-up:commission-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'commission_follow_up_task_created' })]));
  });
});
