import { createActivityEvent } from '../../domain/events';
import type { Commission } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type UpdateCommissionTrackingCommand = Readonly<{ commissionId: string; trackingReference: string; occurredAt: string; recordedAt: string }>;

export async function updateCommissionTracking(repository: WorkspaceRepository, command: UpdateCommissionTrackingCommand): Promise<Commission> {
  const trackingReference = command.trackingReference.trim();
  if (!trackingReference) throw new Error('tracking reference is required');
  return repository.transact(async (tx) => {
    const commission = await tx.getCommission(command.commissionId);
    if (!commission) throw new Error('commission not found');
    const updated = { ...commission, trackingReference };
    await tx.putCommission(updated);
    await tx.putEvents([createActivityEvent({ aggregateType: 'commission', aggregateId: updated.id, type: 'commission_tracking_updated', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { trackingReference } })]);
    return updated;
  });
}
