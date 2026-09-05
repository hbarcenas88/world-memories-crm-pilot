import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

afterEach(cleanup);

describe('application opening reconciliation', () => {
  it('reconciles ended Trips and overdue Commissions once when the application opens', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Consulta de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: '2026-09-01T08:00:00.000Z' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: '2026-09-01T08:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveEndOn: '2026-08-31', createdAt: '2026-09-01T08:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-09-01T08:00:00.000Z' });
    await repository.seedCommission({ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, dueOn: '2026-08-31', status: 'expected', createdAt: '2026-09-01T08:00:00.000Z' });

    render(<App repository={repository} />);

    await waitFor(async () => expect(await repository.getTrip('trip-1')).toMatchObject({ status: 'completed' }));
    await expect(repository.listTasksForTrip('trip-1')).resolves.toEqual([expect.objectContaining({ commissionId: 'commission-1', source: 'commission_follow_up' })]);
  });
});
