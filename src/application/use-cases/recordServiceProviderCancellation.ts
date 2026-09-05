import { createActivityEvent } from '../../domain/events';
import type { Commission, ServiceProvider } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

export type ServiceProviderCancellationCommand = Readonly<{
  serviceProviderId: string;
  cancellationOutcome: NonNullable<ServiceProvider['cancellationOutcome']>;
  commissionOutcome: 'cancel' | 'continue';
  occurredAt: string;
  recordedAt: string;
}>;

export async function recordServiceProviderCancellation(
  repository: WorkspaceRepository,
  command: ServiceProviderCancellationCommand,
): Promise<Readonly<{ component: ServiceProvider; commissions: readonly Commission[] }>> {
  return repository.transact(async (tx) => {
    const component = await tx.getServiceProvider(command.serviceProviderId);
    if (!component) throw new Error('service provider not found');
    const commissions = await tx.listCommissionsForServiceProvider(component.id);
    const updatedComponent: ServiceProvider = {
      ...component,
      cancellationOutcome: command.cancellationOutcome,
      cancelledAt: command.recordedAt,
    };
    const cancelledCommissionIds = new Set(
      command.commissionOutcome === 'cancel'
        ? commissions.filter((commission) => commission.status === 'expected').map((commission) => commission.id)
        : [],
    );
    const updatedCommissions = commissions.map((commission) => cancelledCommissionIds.has(commission.id)
      ? { ...commission, status: 'cancelled' as const }
      : commission);

    await tx.putServiceProvider(updatedComponent);
    for (const commission of updatedCommissions) await tx.putCommission(commission);
    const events = [
      createActivityEvent({
        aggregateType: 'service',
        aggregateId: component.serviceId,
        type: 'service_provider_cancellation_recorded',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: {
          serviceProviderId: component.id,
          cancellationOutcome: command.cancellationOutcome,
          commissionOutcome: command.commissionOutcome,
        },
      }),
      ...updatedCommissions
        .filter((commission) => cancelledCommissionIds.has(commission.id))
        .map((commission) => createActivityEvent({
          aggregateType: 'commission' as const,
          aggregateId: commission.id,
          type: 'commission_cancelled_from_service_provider_cancellation',
          occurredAt: command.occurredAt,
          recordedAt: command.recordedAt,
          payload: { serviceProviderId: component.id, cancellationOutcome: command.cancellationOutcome },
        })),
    ];
    await tx.putEvents(events);
    return { component: updatedComponent, commissions: updatedCommissions };
  });
}
