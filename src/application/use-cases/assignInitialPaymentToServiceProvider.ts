import { createActivityEvent } from '../../domain/events';
import type { Payment } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type AssignInitialPaymentCommand = Readonly<{ paymentId: string; serviceProviderId: string; occurredAt: string; recordedAt: string }>;

export async function assignInitialPaymentToServiceProvider(repository: WorkspaceRepository, command: AssignInitialPaymentCommand): Promise<Payment> {
  return repository.transact(async (tx) => {
    const [payment, component] = await Promise.all([tx.getPayment(command.paymentId), tx.getServiceProvider(command.serviceProviderId)]);
    if (!payment) throw new Error('payment not found');
    if (payment.source !== 'first_conversion_payment') throw new Error('payment is not an initial conversion payment');
    if (!component) throw new Error('service provider not found');
    const service = await tx.getService(component.serviceId);
    if (!service || service.tripId !== payment.tripId) throw new Error('service provider does not belong to payment trip');
    if (component.currency !== payment.amount.currency) throw new Error('initial payment currency must match component currency');
    const assigned = { ...payment, serviceProviderId: component.id };
    await tx.putPayment(assigned);
    await tx.putEvents([createActivityEvent({ aggregateType: 'trip', aggregateId: payment.tripId, type: 'initial_payment_assigned_to_component', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { paymentId: payment.id, serviceProviderId: component.id } })]);
    return assigned;
  });
}
