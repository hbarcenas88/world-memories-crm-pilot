import { describe, expect, it } from 'vitest';
import { createLead } from '../../src/application/use-cases/createLead';
import { linkExistingClient } from '../../src/application/use-cases/linkExistingClient';
import { transitionLead } from '../../src/application/use-cases/transitionLead';
import { updateLead } from '../../src/application/use-cases/updateLead';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const createdAt = '2026-08-25T12:00:00.000Z';

describe('Lead use cases', () => {
  it('persists a direct contacted lead together with its commercial events', async () => {
    const repository = new MemoryWorkspaceRepository();

    const result = await createLead(repository, {
      draft: { name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', initialStatus: 'contacted' },
      occurredAt: createdAt,
      recordedAt: createdAt,
    });

    expect(await repository.getLead(result.lead.id)).toEqual(result.lead);
    expect(result.events.map((event) => event.type)).toEqual(['lead_received', 'lead_contacted']);
  });

  it('persists quote sent and returns an editable follow-up task suggestion', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'quote_preparing', createdAt });

    const result = await transitionLead(repository, { leadId: 'lead-1', to: 'quote_sent', occurredAt: createdAt, recordedAt: createdAt, suggestedTaskTitle: 'Follow up on quote' });

    expect(result.lead.status).toBe('quote_sent');
    expect(result.event.type).toBe('quote_sent');
    expect(result.suggestedTask).toMatchObject({ title: 'Follow up on quote', dueOn: '2026-08-29' });
    await expect(repository.listTasksForLead('lead-1')).resolves.toEqual([
      expect.objectContaining({ leadId: 'lead-1', title: 'Follow up on quote', dueOn: '2026-08-29', status: 'open' }),
    ]);
  });

  it('only creates the suggested pause follow-up when the operator explicitly accepts it', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt });

    await transitionLead(repository, { leadId: 'lead-1', to: 'paused', occurredAt: createdAt, recordedAt: createdAt, pausedTaskTitle: 'Retomar lead pausado' });
    await expect(repository.listTasksForLead('lead-1')).resolves.toEqual([]);

    await transitionLead(repository, { leadId: 'lead-1', to: 'follow_up', occurredAt: createdAt, recordedAt: createdAt });
    await transitionLead(repository, { leadId: 'lead-1', to: 'paused', occurredAt: createdAt, recordedAt: createdAt, pausedTaskTitle: 'Retomar lead pausado', createPausedFollowUp: true });
    await expect(repository.listTasksForLead('lead-1')).resolves.toEqual([expect.objectContaining({ title: 'Retomar lead pausado', leadId: 'lead-1', source: 'lead_follow_up' })]);
  });

  it('links an existing client without changing the commercial status', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'follow_up', createdAt });
    await repository.seedClient({ id: 'client-1', name: 'Familia López', createdAt });

    const result = await linkExistingClient(repository, { leadId: 'lead-1', clientId: 'client-1', occurredAt: createdAt, recordedAt: createdAt });

    expect(result.lead).toMatchObject({ clientId: 'client-1', status: 'follow_up' });
    expect(result.event).toMatchObject({ type: 'lead_client_linked', aggregateId: 'lead-1' });
  });

  it('does not allow a sold Lead to be reassigned to a different Client', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'MarÃ­a', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt });
    await repository.seedClient({ id: 'client-1', name: 'Familia Rivera', createdAt });
    await repository.seedClient({ id: 'client-2', name: 'Familia Torres', createdAt });

    await expect(linkExistingClient(repository, { leadId: 'lead-1', clientId: 'client-2', occurredAt: createdAt, recordedAt: createdAt }))
      .rejects.toThrow('sold lead client cannot be changed');
    await expect(repository.getLead('lead-1')).resolves.toMatchObject({ clientId: 'client-1', tripId: 'trip-1' });
  });

  it('updates editable Lead fields without changing its commercial relationships and records the correction', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt });
    await repository.seedClient({ id: 'client-1', name: 'Familia Rivera', createdAt });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt });

    const result = await updateLead(repository, {
      leadId: 'lead-1',
      draft: { name: 'María López', acquisitionSource: 'Referido', referredBy: 'Carolina', residenceCountry: 'Panamá', phone: '6000-0000', email: 'maria@example.com', destination: 'Orlando', travelType: 'Paquete Disney', requestedDateStatus: 'dates_known', budget: { amount: 3200, currency: 'USD' } },
      occurredAt: '2026-08-29T12:00:00.000Z',
      recordedAt: '2026-08-29T12:05:00.000Z',
    });

    expect(result.lead).toMatchObject({ id: 'lead-1', name: 'María López', status: 'sold', clientId: 'client-1', tripId: 'trip-1', destination: 'Orlando', budget: { amount: 3200, currency: 'USD' } });
    expect(result.event).toMatchObject({ type: 'lead_updated', aggregateId: 'lead-1', occurredAt: '2026-08-29T12:00:00.000Z', recordedAt: '2026-08-29T12:05:00.000Z' });
    await expect(repository.getLead('lead-1')).resolves.toMatchObject({ status: 'sold', clientId: 'client-1', tripId: 'trip-1', name: 'María López' });
  });
});
