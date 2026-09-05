import type { Money, MoneyTotals } from './types';

const currencies = new Set(['USD', 'MXN']);

export function assertMoney(input: unknown): Money {
  if (typeof input !== 'object' || input === null) {
    throw new Error('money must be an object');
  }

  const candidate = input as { amount?: unknown; currency?: unknown };

  if (!currencies.has(String(candidate.currency))) {
    throw new Error('currency is required');
  }

  if (typeof candidate.amount !== 'number' || !Number.isFinite(candidate.amount) || candidate.amount < 0) {
    throw new Error('amount must be a non-negative finite number');
  }

  return { amount: candidate.amount, currency: candidate.currency as Money['currency'] };
}

export function addMoney(items: readonly Money[]): MoneyTotals {
  return items.reduce<MoneyTotals>(
    (totals, item) => ({ ...totals, [item.currency]: totals[item.currency] + item.amount }),
    { USD: 0, MXN: 0 },
  );
}
