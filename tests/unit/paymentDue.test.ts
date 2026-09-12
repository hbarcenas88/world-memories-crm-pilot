import { describe, expect, it } from 'vitest';
import { customerBalance, hasOutstandingCustomerBalance, paymentDueReminderDates } from '../../src/domain/paymentDue';

describe('payment due reminders', () => {
  it('creates internal reminders 30, 7, 1 and 0 days before the due date', () => {
    expect(paymentDueReminderDates('2026-12-30')).toEqual(['2026-11-30', '2026-12-23', '2026-12-29', '2026-12-30']);
    expect(paymentDueReminderDates('2026-05-31')).toEqual(['2026-05-01', '2026-05-24', '2026-05-30', '2026-05-31']);
  });

  it('derives a non-negative balance only when payment currency matches the component', () => {
    expect(customerBalance({ amount: 1000, currency: 'USD' }, [{ amount: 250, currency: 'USD' }, { amount: 300, currency: 'USD' }])).toBe(450);
    expect(() => customerBalance({ amount: 1000, currency: 'USD' }, [{ amount: 250, currency: 'MXN' }])).toThrow('customer payment currency must match component currency');
  });

  it('only marks a component outstanding from comparable, non-archived payments assigned to it', () => {
    const component = { id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD' as const, saleAmount: 1000, commissionStatus: 'without_commission' as const, createdAt: '2026-08-01T00:00:00.000Z' };
    const paid = { id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 1000, currency: 'USD' as const }, occurredAt: '2026-08-02T00:00:00.000Z', recordedAt: '2026-08-02T00:00:00.000Z', status: 'received' as const, source: 'customer_payment' as const };
    expect(hasOutstandingCustomerBalance(component, [paid])).toBe(false);
    expect(hasOutstandingCustomerBalance(component, [{ ...paid, serviceProviderId: 'component-2' }])).toBe(true);
    expect(hasOutstandingCustomerBalance(component, [{ ...paid, amount: { amount: 1000, currency: 'MXN' } }])).toBe(false);
  });
});
