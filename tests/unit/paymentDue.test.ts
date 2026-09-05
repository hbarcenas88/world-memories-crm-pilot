import { describe, expect, it } from 'vitest';
import { customerBalance, paymentDueReminderDates } from '../../src/domain/paymentDue';

describe('payment due reminders', () => {
  it('creates internal reminders 30, 7, 1 and 0 days before the due date', () => {
    expect(paymentDueReminderDates('2026-12-30')).toEqual(['2026-11-30', '2026-12-23', '2026-12-29', '2026-12-30']);
    expect(paymentDueReminderDates('2026-05-31')).toEqual(['2026-05-01', '2026-05-24', '2026-05-30', '2026-05-31']);
  });

  it('derives a non-negative balance only when payment currency matches the component', () => {
    expect(customerBalance({ amount: 1000, currency: 'USD' }, [{ amount: 250, currency: 'USD' }, { amount: 300, currency: 'USD' }])).toBe(450);
    expect(() => customerBalance({ amount: 1000, currency: 'USD' }, [{ amount: 250, currency: 'MXN' }])).toThrow('customer payment currency must match component currency');
  });
});
