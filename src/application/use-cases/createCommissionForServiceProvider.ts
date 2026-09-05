import { calculateCommissionAmounts, expectedCommissionDueOn } from '../../domain/commission';
import { commissionProjectionFromTrip } from '../../domain/commissionProjection';
import { createActivityEvent } from '../../domain/events';
import type { Commission } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type CreateCommissionCommand = Readonly<{ serviceProviderId: string; variableGrossAmount?: number; occurredAt: string; recordedAt: string }>;

export async function createCommissionForServiceProvider(repository: WorkspaceRepository, command: CreateCommissionCommand): Promise<Commission | undefined> {
  return repository.transact(async (tx) => {
    const component = await tx.getServiceProvider(command.serviceProviderId);
    if (!component) throw new Error('service provider not found');
    if (component.commissionStatus === 'without_commission') return undefined;
    const service = await tx.getService(component.serviceId);
    if (!service) throw new Error('service not found');
    const [trip, provider] = await Promise.all([tx.getTrip(service.tripId), tx.getProvider(component.providerId)]);
    if (!trip) throw new Error('trip not found');
    if (!provider) throw new Error('provider not found');
    const grossCommissionMode = provider.grossCommissionMode ?? 'variable_amount_per_service';
    const variableGrossAmount = command.variableGrossAmount ?? component.variableGrossCommissionAmount;
    const amounts = calculateCommissionAmounts({
      ...(component.saleAmount === undefined ? {} : { saleAmount: { amount: component.saleAmount, currency: component.currency } }),
      grossCommissionMode,
      ...(provider.defaultGrossRate === undefined ? {} : { defaultGrossRate: provider.defaultGrossRate }),
      ...(variableGrossAmount === undefined ? {} : { variableGrossAmount: { amount: variableGrossAmount, currency: component.currency } }),
      commissionRate: provider.commissionRate ?? 0.8,
    });
    const commission: Commission = {
      id: crypto.randomUUID(), tripId: trip.id, providerId: provider.id, serviceProviderId: component.id,
      expected: amounts.expected, grossAmount: amounts.gross, grossCommissionMode,
      ...(grossCommissionMode === 'fixed_percentage' ? { grossRate: provider.defaultGrossRate } : {}),
      agencyShareRate: provider.commissionRate ?? 0.8,
      ...commissionProjectionFromTrip(trip, amounts.expected),
      ...(trip.effectiveEndOn ? { dueOn: expectedCommissionDueOn(trip.effectiveEndOn, provider.commissionDueDays ?? 90) } : {}),
      status: 'expected', createdAt: command.recordedAt,
    };
    await tx.putCommission(commission);
    await tx.putEvents([createActivityEvent({ aggregateType: 'commission', aggregateId: commission.id, type: 'commission_created_for_service_provider', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { serviceProviderId: component.id, grossAmount: amounts.gross, expected: amounts.expected } })]);
    return commission;
  });
}
