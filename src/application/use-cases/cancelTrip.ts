import { createActivityEvent } from '../../domain/events';
import type { Trip } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type CancelTripCommand = Readonly<{ tripId: string; occurredAt: string; recordedAt: string }>;

/**
 * A trip cancellation is a historical business event. It deliberately does
 * not remove payments, components, or Commission records; their individual
 * cancellation outcomes remain explicit decisions.
 */
export async function cancelTrip(repository: WorkspaceRepository, command: CancelTripCommand): Promise<Trip> {
  return repository.transact(async (tx) => {
    const trip = await tx.getTrip(command.tripId);
    if (!trip) throw new Error('trip not found');
    if (trip.status === 'cancelled') return trip;
    const cancelled: Trip = { ...trip, status: 'cancelled', lastSavedAt: command.recordedAt };
    await tx.putTrip(cancelled);
    await tx.putEvents([createActivityEvent({
      aggregateType: 'trip',
      aggregateId: trip.id,
      type: 'trip_cancelled',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: { preservesHistoricalPaymentsAndCommissions: true },
    })]);
    return cancelled;
  });
}
