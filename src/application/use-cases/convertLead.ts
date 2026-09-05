import { assertMoney } from '../../domain/money';
import type { ActivityEvent, Client, Payment, Trip } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type ConvertLeadCommand = Readonly<{
  leadId: string;
  clientId?: string;
  primaryMemberId?: string;
  firstPayment: unknown;
  occurredAt: string;
  recordedAt: string;
}>;

const convertibleStatuses = new Set(['quote_sent', 'follow_up', 'review_adjustments']);

export async function convertLead(repository: WorkspaceRepository, command: ConvertLeadCommand): Promise<{ client: Client; trip: Trip; payment: Payment; events: readonly ActivityEvent[] }> {
  const firstPayment = assertMoney(command.firstPayment);
  return repository.transact(async (tx) => {
    const lead = await tx.getLead(command.leadId);
    if (!lead) throw new Error('lead not found');
    if (!convertibleStatuses.has(lead.status)) throw new Error('lead cannot be converted from its current status');

    const clientId = command.clientId ?? lead.clientId;
    const existingClient = clientId ? await tx.getClient(clientId) : undefined;
    if (clientId && !existingClient) throw new Error('client not found');

    const newPrimaryMemberId = crypto.randomUUID();
    const client: Client = existingClient ?? {
      id: crypto.randomUUID(),
      name: lead.name,
      createdAt: command.recordedAt,
      members: [{ id: newPrimaryMemberId, name: lead.name, status: 'active' }],
    };
    const activeMembers = (client.members ?? []).filter((member) => member.status === 'active');
    const primaryMemberId = existingClient
      ? command.primaryMemberId ?? activeMembers[0]?.id
      : newPrimaryMemberId;
    if (!primaryMemberId || !activeMembers.some((member) => member.id === primaryMemberId)) {
      throw new Error('an active client primary contact is required before conversion');
    }
    const trip: Trip = {
      id: crypto.randomUUID(),
      leadId: lead.id,
      clientId: client.id,
      status: 'active',
      primaryMemberId,
      travelerMemberIds: [primaryMemberId],
      createdAt: command.recordedAt,
    };
    const payment: Payment = {
      id: crypto.randomUUID(), tripId: trip.id, amount: firstPayment, occurredAt: command.occurredAt, recordedAt: command.recordedAt,
      status: 'received', source: 'first_conversion_payment',
    };
    const soldLead = { ...lead, status: 'sold' as const, clientId: client.id, tripId: trip.id };
    const events: readonly ActivityEvent[] = [
      { id: crypto.randomUUID(), aggregateType: 'lead', aggregateId: lead.id, type: 'lead_converted', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { fromStatus: lead.status, toStatus: 'sold', tripId: trip.id, paymentId: payment.id } },
      { id: crypto.randomUUID(), aggregateType: 'trip', aggregateId: trip.id, type: 'trip_created', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { leadId: lead.id, clientId: client.id } },
      { id: crypto.randomUUID(), aggregateType: 'trip', aggregateId: trip.id, type: 'payment_recorded', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { paymentId: payment.id, amount: firstPayment, source: payment.source } },
    ];

    if (!existingClient) await tx.putClient(client);
    await tx.putTrip(trip);
    await tx.putPayment(payment);
    await tx.putLead(soldLead);
    await tx.putEvents(events);
    return { client, trip, payment, events };
  });
}
