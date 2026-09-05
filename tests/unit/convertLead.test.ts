import { describe, expect, it } from 'vitest';
import { convertLead } from '../../src/application/use-cases/convertLead';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('convertLead', () => {
  it('creates a trip and links a new client only after a valid first payment', async () => {
    const repository = new MemoryWorkspaceRepository({
      id: 'lead-1', name: 'María', status: 'review_adjustments', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define',
    });

    const result = await convertLead(repository, {
      leadId: 'lead-1',
      firstPayment: { amount: 500, currency: 'USD' },
      occurredAt: '2026-08-26T12:00:00.000Z',
      recordedAt: '2026-08-26T12:05:00.000Z',
    });

    expect(result.client.name).toBe('María');
    expect(result.client.members).toEqual([expect.objectContaining({ name: 'María', status: 'active' })]);
    expect(result.trip.primaryMemberId).toBe(result.client.members?.[0]?.id);
    expect(result.trip.travelerMemberIds).toEqual([result.client.members?.[0]?.id]);
    expect(result.trip.leadId).toBe('lead-1');
    expect(result.trip.status).toBe('active');
    expect(result.events.map((event) => event.type)).toEqual(['lead_converted', 'trip_created', 'payment_recorded']);
    expect(result.payment).toMatchObject({ tripId: result.trip.id, amount: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:05:00.000Z' });
    expect(await repository.getLead('lead-1')).toMatchObject({ status: 'sold', clientId: result.client.id, tripId: result.trip.id });
  });

  it('does not convert a lead when the first payment has no selected currency', async () => {
    const repository = new MemoryWorkspaceRepository({
      id: 'lead-1', name: 'María', status: 'review_adjustments', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define',
    });

    await expect(convertLead(repository, { leadId: 'lead-1', firstPayment: { amount: 500 } as never, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' }))
      .rejects.toThrow('currency is required');

    await expect(repository.getLead('lead-1')).resolves.toMatchObject({ status: 'review_adjustments' });
  });

  it('links an existing client instead of creating a duplicate during conversion', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'María', status: 'review_adjustments', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.putClient({ id: 'client-1', name: 'María existente', createdAt: '2026-01-01T00:00:00.000Z', members: [{ id: 'member-1', name: 'María existente', status: 'active' }] });

    const result = await convertLead(repository, { leadId: 'lead-1', clientId: 'client-1', firstPayment: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(result.client.id).toBe('client-1');
    expect(result.trip).toMatchObject({ clientId: 'client-1', primaryMemberId: 'member-1', travelerMemberIds: ['member-1'] });
  });

  it('uses a Client already linked to the Lead when no client is supplied again', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'MarÃ­a', status: 'review_adjustments', clientId: 'client-1', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.putClient({ id: 'client-1', name: 'MarÃ­a existente', createdAt: '2026-01-01T00:00:00.000Z', members: [{ id: 'member-1', name: 'MarÃ­a existente', status: 'active' }] });

    const result = await convertLead(repository, { leadId: 'lead-1', firstPayment: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(result.client.id).toBe('client-1');
    expect(result.trip.clientId).toBe('client-1');
  });

  it('allows a sale directly after the quotation was sent', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'quote_sent', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });

    const result = await convertLead(repository, { leadId: 'lead-1', firstPayment: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' });

    expect(result.trip.status).toBe('active');
  });

  it('rejects conversion from a Lead status that has not reached commercial review', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'MarÃ­a', status: 'contacted', createdAt: '2026-08-25T12:00:00.000Z', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });

    await expect(convertLead(repository, { leadId: 'lead-1', firstPayment: { amount: 500, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z' }))
      .rejects.toThrow('lead cannot be converted from its current status');
    await expect(repository.getLead('lead-1')).resolves.toMatchObject({ status: 'contacted' });
  });
});
