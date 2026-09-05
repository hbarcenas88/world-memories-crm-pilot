import { createActivityEvent } from '../../domain/events';
import type { Money, Payment } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type CorrectCustomerPaymentCommand = Readonly<{
  paymentId: string;
  amount: Money;
  occurredAt: string;
  recordedAt: string;
}>;

function validateAmount(amount: Money): void {
  if (!Number.isFinite(amount.amount) || amount.amount <= 0) throw new Error('customer payment amount must be positive');
}

export async function correctCustomerPayment(repository: WorkspaceRepository, command: CorrectCustomerPaymentCommand): Promise<Payment> {
  validateAmount(command.amount);
  return repository.transact(async (tx) => {
    const payment = await tx.getPayment(command.paymentId);
    if (!payment) throw new Error('payment not found');
    if (payment.archivedAt) throw new Error('archived payment must be restored before correction');
    if (!payment.serviceProviderId) throw new Error('payment must be assigned to a provider component before correction');
    const component = await tx.getServiceProvider(payment.serviceProviderId);
    if (!component) throw new Error('service provider not found');
    const service = await tx.getService(component.serviceId);
    if (!service || service.tripId !== payment.tripId) throw new Error('service provider does not belong to payment trip');
    if (service.archivedAt) throw new Error('archived service must be restored before payment correction');
    if (component.currency !== command.amount.currency) throw new Error('customer payment currency must match component currency');
    const corrected: Payment = { ...payment, amount: command.amount, occurredAt: command.occurredAt, recordedAt: command.recordedAt };
    await tx.putPayment(corrected);
    await tx.putEvents([createActivityEvent({
      aggregateType: 'payment',
      aggregateId: payment.id,
      type: 'customer_payment_corrected',
      occurredAt: command.recordedAt,
      recordedAt: command.recordedAt,
      payload: {
        previousAmount: payment.amount.amount,
        amount: command.amount.amount,
        currency: command.amount.currency,
        previousOccurredAt: payment.occurredAt,
        occurredAt: command.occurredAt,
      },
    })]);
    return corrected;
  });
}
