import { createActivityEvent } from '../../domain/events';
import type { Money, Payment } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type RecordCustomerPaymentCommand = Readonly<{ tripId: string; serviceProviderId: string; amount: Money; occurredAt: string; recordedAt: string }>;

export async function recordCustomerPayment(repository: WorkspaceRepository, command: RecordCustomerPaymentCommand): Promise<Payment> {
  if (!Number.isFinite(command.amount.amount) || command.amount.amount <= 0) throw new Error('customer payment amount must be positive');
  return repository.transact(async (tx) => {
    const component = await tx.getServiceProvider(command.serviceProviderId);
    if (!component) throw new Error('service provider not found');
    const service = await tx.getService(component.serviceId);
    if (!service || service.tripId !== command.tripId) throw new Error('service provider does not belong to trip');
    if (component.currency !== command.amount.currency) throw new Error('customer payment currency must match component currency');
    const payment: Payment = { id: crypto.randomUUID(), tripId: command.tripId, serviceProviderId: command.serviceProviderId, amount: command.amount, occurredAt: command.occurredAt, recordedAt: command.recordedAt, status: 'received', source: 'customer_payment' };
    await tx.putPayment(payment);
    await tx.putEvents([createActivityEvent({ aggregateType: 'trip', aggregateId: command.tripId, type: 'customer_payment_recorded', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { serviceProviderId: command.serviceProviderId, currency: command.amount.currency } })]);
    return payment;
  });
}
