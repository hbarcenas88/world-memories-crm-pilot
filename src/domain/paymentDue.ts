import { formatISO, subDays } from 'date-fns';
import type { Money } from './types';

export function paymentDueReminderDates(dueOn: string): readonly string[] {
  const due = new Date(`${dueOn}T12:00:00Z`);
  return [subDays(due, 30), subDays(due, 7), subDays(due, 1), due].map((date) => formatISO(date, { representation: 'date' }));
}

export function customerBalance(total: Money, payments: readonly Money[]): number {
  let paid = 0;
  for (const payment of payments) {
    if (payment.currency !== total.currency) throw new Error('customer payment currency must match component currency');
    paid += payment.amount;
  }
  return Math.max(0, total.amount - paid);
}
