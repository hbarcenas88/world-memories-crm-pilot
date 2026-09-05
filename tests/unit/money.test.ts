import { describe, expect, it } from 'vitest';
import { addMoney, assertMoney } from '../../src/domain/money';

describe('addMoney', () => {
  it('keeps USD and MXN totals separate instead of converting them implicitly', () => {
    expect(
      addMoney([
        { amount: 20, currency: 'USD' },
        { amount: 50, currency: 'MXN' },
        { amount: 15, currency: 'USD' },
      ]),
    ).toEqual({ USD: 35, MXN: 50 });
  });
});

describe('assertMoney', () => {
  it('rejects a monetary amount when its currency was not selected first', () => {
    expect(() => assertMoney({ amount: 1200 })).toThrow('currency is required');
  });

  it('rejects a negative amount instead of silently saving it', () => {
    expect(() => assertMoney({ amount: -1, currency: 'USD' })).toThrow('amount must be a non-negative finite number');
  });
});
