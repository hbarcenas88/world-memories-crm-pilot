import { createActivityEvent } from '../../domain/events';
import type { WorkspaceRepository } from '../ports';

type ReconcileWorkspaceCommand = Readonly<{
  today: string;
  commissionFollowUpTitle: string;
  occurredAt: string;
  recordedAt: string;
}>;

export async function reconcileWorkspace(repository: WorkspaceRepository, command: ReconcileWorkspaceCommand): Promise<Readonly<{ completedTripCount: number; createdCommissionFollowUpCount: number }>> {
  const [tripSnapshots, commissionSnapshots] = await Promise.all([repository.listTrips(), repository.listCommissions()]);
  return repository.transact(async (tx) => {
    const events = [];
    let completedTripCount = 0;
    let createdCommissionFollowUpCount = 0;
    for (const snapshot of tripSnapshots) {
      if (snapshot.status !== 'active' || !snapshot.effectiveEndOn || snapshot.effectiveEndOn >= command.today) continue;
      const trip = await tx.getTrip(snapshot.id);
      if (!trip || trip.status !== 'active' || !trip.effectiveEndOn || trip.effectiveEndOn >= command.today) continue;
      await tx.putTrip({ ...trip, status: 'completed' });
      events.push(createActivityEvent({ aggregateType: 'trip', aggregateId: trip.id, type: 'trip_reconciled_completed', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { effectiveEndOn: trip.effectiveEndOn } }));
      completedTripCount += 1;
    }
    for (const snapshot of commissionSnapshots) {
      if (snapshot.status !== 'expected' || !snapshot.dueOn || snapshot.dueOn >= command.today) continue;
      const commission = await tx.getCommission(snapshot.id);
      if (!commission || commission.status !== 'expected' || !commission.dueOn || commission.dueOn >= command.today) continue;
      const existing = (await tx.listTasksForTrip(commission.tripId)).some((task) => task.source === 'commission_follow_up' && task.commissionId === commission.id);
      if (existing) continue;
      const task = {
        id: `commission-follow-up:${commission.id}`,
        title: command.commissionFollowUpTitle,
        required: false,
        dueOn: commission.dueOn,
        tripId: commission.tripId,
        commissionId: commission.id,
        source: 'commission_follow_up' as const,
        status: 'open' as const,
        createdAt: command.recordedAt,
      };
      await tx.putTask(task);
      events.push(createActivityEvent({ aggregateType: 'task', aggregateId: task.id, type: 'commission_follow_up_task_created', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { commissionId: commission.id, dueOn: commission.dueOn } }));
      createdCommissionFollowUpCount += 1;
    }
    if (events.length > 0) await tx.putEvents(events);
    return { completedTripCount, createdCommissionFollowUpCount };
  });
}
