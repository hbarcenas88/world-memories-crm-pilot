import { commissionProjectionFromRate, commissionProjectionFromTrip } from '../../domain/commissionProjection';
import { createActivityEvent } from '../../domain/events';
import type { Commission, Currency } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type OverrideCommand = Readonly<{
  commissionId: string;
  mode: 'override';
  baseCurrency: Currency;
  quoteCurrency: Currency;
  exchangeRate: number;
  occurredAt: string;
  recordedAt: string;
}>;
type FollowTripCommand = Readonly<{
  commissionId: string;
  mode: 'follow_trip';
  occurredAt: string;
  recordedAt: string;
}>;
type UpdateCommissionProjectionRateCommand = OverrideCommand | FollowTripCommand;

function projectionPayload(commission: Commission) {
  return {
    baseCurrency: commission.projectionRateBaseCurrency ?? null,
    quoteCurrency: commission.projectionRateQuoteCurrency ?? null,
    rate: commission.projectionExchangeRate ?? null,
    source: commission.projectionRateSource ?? null,
  };
}

export async function updateCommissionProjectionRate(repository: WorkspaceRepository, command: UpdateCommissionProjectionRateCommand) {
  if (command.mode === 'override') {
    if (command.baseCurrency === command.quoteCurrency) throw new Error('commission projection currencies must differ');
    if (!Number.isFinite(command.exchangeRate) || command.exchangeRate <= 0) throw new Error('commission projection rate must be positive');
  }
  return repository.transact(async (tx) => {
    const commission = await tx.getCommission(command.commissionId);
    if (!commission) throw new Error('commission not found');
    const previous = projectionPayload(commission);
    const trip = command.mode === 'follow_trip' ? await tx.getTrip(commission.tripId) : undefined;
    if (command.mode === 'follow_trip' && !trip) throw new Error('commission trip not found');
    const projection = command.mode === 'override'
      ? commissionProjectionFromRate(commission.expected, command.baseCurrency, command.quoteCurrency, command.exchangeRate, 'commission_override')
      : commissionProjectionFromTrip(trip!, commission.expected);
    const updated = { ...commission, ...projection };
    await tx.putCommission(updated);
    await tx.putEvents([createActivityEvent({
      aggregateType: 'commission',
      aggregateId: commission.id,
      type: command.mode === 'override' ? 'commission_projection_rate_overridden' : 'commission_projection_rate_reverted_to_trip',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: {
        previous,
        next: projectionPayload(updated),
        previousRate: previous.rate,
        nextRate: updated.projectionExchangeRate ?? null,
      },
    })]);
    return updated;
  });
}
