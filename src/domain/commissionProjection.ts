import type { Commission, Money, Trip } from './types';

type TripRateProjection = Pick<Commission, 'projectionRateBaseCurrency' | 'projectionRateQuoteCurrency' | 'projectionExchangeRate' | 'projectionRateSource' | 'projectedReferenceAmount'>;

function projectedAmount(expected: Money, base: Money['currency'], quote: Money['currency'], rate: number): Money | undefined {
  if (expected.currency === base) return { amount: expected.amount * rate, currency: quote };
  if (expected.currency === quote) return { amount: expected.amount / rate, currency: base };
  return undefined;
}

/**
 * Produces the Commission projection that follows a Trip. Original and received
 * amounts stay untouched; this is a planning-only conversion snapshot.
 */
export function commissionProjectionFromRate(expected: Money, base: Money['currency'], quote: Money['currency'], rate: number, source: NonNullable<Commission['projectionRateSource']>): TripRateProjection {
  const projected = projectedAmount(expected, base, quote, rate);
  return {
    projectionRateBaseCurrency: base,
    projectionRateQuoteCurrency: quote,
    projectionExchangeRate: rate,
    projectionRateSource: source,
    ...(projected ? { projectedReferenceAmount: projected } : {}),
  };
}

export function commissionProjectionFromTrip(trip: Trip, expected: Money): TripRateProjection {
  const base = trip.referenceRateBaseCurrency;
  const quote = trip.referenceRateQuoteCurrency;
  const rate = trip.referenceExchangeRate;
  if (!base || !quote || typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return { projectionRateSource: 'trip_reference' };
  }
  return commissionProjectionFromRate(expected, base, quote, rate, 'trip_reference');
}
