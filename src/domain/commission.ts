import { addDays, formatISO } from 'date-fns';
import type { Money } from './types';

export function expectedCommissionDueOn(tripEndOn: string, providerDays: number): string {
  const cappedDays = Math.min(Math.max(providerDays, 0), 90);
  return formatISO(addDays(new Date(`${tripEndOn}T12:00:00Z`), cappedDays), { representation: 'date' });
}

export function projectedCommissionAmount(saleAmount: Money, rate: 0.8 | 1): Money {
  return { amount: saleAmount.amount * rate, currency: saleAmount.currency };
}

type CommissionCalculationInput = Readonly<{
  saleAmount?: Money;
  grossCommissionMode: 'fixed_percentage' | 'variable_amount_per_service';
  defaultGrossRate?: number;
  variableGrossAmount?: Money;
  commissionRate: 0.8 | 1;
}>;

export function calculateCommissionAmounts(input: CommissionCalculationInput): Readonly<{ gross: Money; expected: Money }> {
  const gross = input.grossCommissionMode === 'fixed_percentage'
    ? (() => {
      if (!input.saleAmount || input.defaultGrossRate === undefined) throw new Error('fixed commission requires sale amount and gross rate');
      return { amount: input.saleAmount.amount * input.defaultGrossRate, currency: input.saleAmount.currency };
    })()
    : (() => {
      if (!input.variableGrossAmount) throw new Error('variable commission requires gross amount');
      return input.variableGrossAmount;
    })();
  return { gross, expected: projectedCommissionAmount(gross, input.commissionRate) };
}
