import { createActivityEvent } from "../../domain/events";
import {
  calculateCommissionAmounts,
  expectedCommissionDueOn,
} from "../../domain/commission";
import { commissionProjectionFromTrip } from '../../domain/commissionProjection';
import type { Currency, ServiceProvider } from "../../domain/types";
import type { WorkspaceRepository } from "../ports";

type AddProviderToServiceCommand = Readonly<{
  serviceId: string;
  providerId: string;
  currency: Currency;
  amount?: number;
  reservationLocator?: string;
  variableGrossCommissionAmount?: number;
  customerBalanceDueOn?: string;
  commissionStatus?: ServiceProvider['commissionStatus'];
  occurredAt: string;
  recordedAt: string;
}>;

function addOffset(isoDate: string, days?: number, months?: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (months) date.setUTCMonth(date.getUTCMonth() + months);
  if (days) date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function addProviderToService(
  repository: WorkspaceRepository,
  command: AddProviderToServiceCommand,
) {
  const commissionStatus = command.commissionStatus ?? 'with_commission';
  if (!command.currency) throw new Error("currency is required before amount");
  if (
    command.amount !== undefined &&
    (!Number.isFinite(command.amount) || command.amount < 0)
  )
    throw new Error("amount must be a non-negative finite number");
  if (
    command.variableGrossCommissionAmount !== undefined &&
    (!Number.isFinite(command.variableGrossCommissionAmount) ||
      command.variableGrossCommissionAmount < 0)
  )
    throw new Error(
      "variable gross commission must be a non-negative finite number",
    );
  return repository.transact(async (tx) => {
    const [service, provider] = await Promise.all([
      tx.getService(command.serviceId),
      tx.getProvider(command.providerId),
    ]);
    if (!service) throw new Error("service not found");
    if (!provider) throw new Error("provider not found");
    if (provider.status !== "active")
      throw new Error("provider must be active before use");
    if (!provider.allowedCurrencies.includes(command.currency))
      throw new Error("provider does not allow selected currency");
    const serviceProvider = {
      id: crypto.randomUUID(),
      serviceId: command.serviceId,
      providerId: provider.id,
      currency: command.currency,
      ...(command.amount === undefined ? {} : { saleAmount: command.amount }),
      ...(command.reservationLocator?.trim() ? { reservationLocator: command.reservationLocator.trim() } : {}),
      ...(command.variableGrossCommissionAmount === undefined
        ? {}
        : {
            variableGrossCommissionAmount:
              command.variableGrossCommissionAmount,
          }),
      ...(command.customerBalanceDueOn
        ? { customerBalanceDueOn: command.customerBalanceDueOn }
        : {}),
      commissionStatus,
      createdAt: command.recordedAt,
    };
    const templates = await tx.listProviderTaskTemplates(provider.id);
    const tripForSuggestions = await tx.getTrip(service.tripId);
    const suggestedTasks = templates
      .filter((template) => template.active)
      .map((template) => {
        const anchor =
          template.relativeTo === "trip_start"
            ? tripForSuggestions?.effectiveStartOn
            : template.relativeTo === "trip_end"
              ? tripForSuggestions?.effectiveEndOn
              : undefined;
        return {
          templateId: template.id,
          title: template.title,
          required: template.required,
          ...(anchor
            ? {
                dueOn: addOffset(
                  anchor,
                  template.offsetDays,
                  template.offsetMonths,
                ),
              }
            : {}),
          templateSnapshot: {
            title: template.title,
            required: template.required,
            relativeTo: template.relativeTo,
            ...(template.offsetDays === undefined
              ? {}
              : { offsetDays: template.offsetDays }),
            ...(template.offsetMonths === undefined
              ? {}
              : { offsetMonths: template.offsetMonths }),
          },
        };
      });
    await tx.putServiceProvider(serviceProvider);
    const grossCommissionMode =
      provider.grossCommissionMode ?? "variable_amount_per_service";
    const canCreateCommission =
      commissionStatus === "with_commission" &&
      (grossCommissionMode === "fixed_percentage" ||
        command.variableGrossCommissionAmount !== undefined);
    const commission = canCreateCommission
      ? await (async () => {
          const trip = await tx.getTrip(service.tripId);
          if (!trip) throw new Error("trip not found");
          const amounts = calculateCommissionAmounts({
            ...(command.amount === undefined
              ? {}
              : {
                  saleAmount: {
                    amount: command.amount,
                    currency: command.currency,
                  },
                }),
            grossCommissionMode,
            ...(provider.defaultGrossRate === undefined
              ? {}
              : { defaultGrossRate: provider.defaultGrossRate }),
            ...(command.variableGrossCommissionAmount === undefined
              ? {}
              : {
                  variableGrossAmount: {
                    amount: command.variableGrossCommissionAmount,
                    currency: command.currency,
                  },
                }),
            commissionRate: provider.commissionRate ?? 0.8,
          });
          const created = {
            id: crypto.randomUUID(),
            tripId: trip.id,
            providerId: provider.id,
            serviceProviderId: serviceProvider.id,
            expected: amounts.expected,
            grossAmount: amounts.gross,
            grossCommissionMode,
            ...(grossCommissionMode === "fixed_percentage"
              ? { grossRate: provider.defaultGrossRate }
              : {}),
            agencyShareRate: provider.commissionRate ?? 0.8,
            ...commissionProjectionFromTrip(trip, amounts.expected),
            ...(trip.effectiveEndOn
              ? {
                  dueOn: expectedCommissionDueOn(
                    trip.effectiveEndOn,
                    provider.commissionDueDays ?? 90,
                  ),
                }
              : {}),
            status: "expected" as const,
            createdAt: command.recordedAt,
          };
          await tx.putCommission(created);
          return created;
        })()
      : undefined;
    await tx.putEvents([
      createActivityEvent({
        aggregateType: "service",
        aggregateId: command.serviceId,
        type: "service_provider_added",
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: {
          providerId: provider.id,
          currency: command.currency,
          suggestedTaskCount: suggestedTasks.length,
        },
      }),
      ...(commission
        ? [
            createActivityEvent({
              aggregateType: "commission",
              aggregateId: commission.id,
              type: "commission_created_for_service_provider",
              occurredAt: command.occurredAt,
              recordedAt: command.recordedAt,
              payload: {
                serviceProviderId: serviceProvider.id,
                grossAmount: commission.grossAmount,
                expected: commission.expected,
              },
            }),
          ]
        : []),
    ]);
    return { serviceProvider, suggestedTasks, commission };
  });
}
