import { createActivityEvent } from '../../domain/events';
import { commissionProjectionFromTrip } from '../../domain/commissionProjection';
import type { Client, RichNote, Service, ServiceAdditionalItem, Trip } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type SaveTripWorkspaceCommand = Readonly<{
  client: Client;
  trip: Trip;
  services: readonly Service[];
  serviceAdditionalItems?: readonly ServiceAdditionalItem[];
  notes: readonly RichNote[];
  referenceRateChangeConfirmed?: boolean;
  referenceRateChangeReason?: string;
  occurredAt: string;
  recordedAt: string;
}>;

function deriveTripInterval(trip: Trip, services: readonly Service[]): Trip {
  const starts = services.flatMap((service) => service.startOn ? [service.startOn] : []);
  const ends = services.flatMap((service) => service.endOn ? [service.endOn] : []);
  const computedStartOn = starts.length > 0 ? [...starts].sort()[0] : undefined;
  const computedEndOn = ends.length > 0 ? [...ends].sort().at(-1) : undefined;
  return {
    ...trip,
    ...(computedStartOn ? { computedStartOn } : {}),
    ...(computedEndOn ? { computedEndOn } : {}),
    effectiveStartOn: trip.overrideStartOn ?? computedStartOn,
    effectiveEndOn: trip.overrideEndOn ?? computedEndOn,
  };
}

function validate(command: SaveTripWorkspaceCommand): void {
  if (command.trip.clientId !== command.client.id) throw new Error('trip does not belong to client');
  if (command.services.some((service) => service.tripId !== command.trip.id)) throw new Error('service does not belong to trip');
  const serviceIds = new Set(command.services.map((service) => service.id));
  if (command.serviceAdditionalItems?.some((item) => !serviceIds.has(item.serviceId))) throw new Error('service additional item does not belong to trip');
  if (command.notes.some((note) => note.ownerType === 'trip' && note.ownerId !== command.trip.id)) throw new Error('trip note does not belong to trip');
  if (command.notes.some((note) => note.ownerType === 'client' && note.ownerId !== command.client.id)) throw new Error('client note does not belong to client');
  const memberIds = new Set(command.client.members?.map((member) => member.id) ?? []);
  if (command.trip.primaryMemberId && !memberIds.has(command.trip.primaryMemberId)) throw new Error('trip primary traveler is not a client member');
  if (command.trip.travelerMemberIds?.some((memberId) => !memberIds.has(memberId))) throw new Error('trip traveler is not a client member');
  if (command.trip.primaryMemberId && command.trip.travelerMemberIds && !command.trip.travelerMemberIds.includes(command.trip.primaryMemberId)) throw new Error('trip primary traveler must participate in trip');
  const hasReferenceRate = command.trip.referenceRateBaseCurrency !== undefined || command.trip.referenceRateQuoteCurrency !== undefined || command.trip.referenceExchangeRate !== undefined;
  if (hasReferenceRate && (!command.trip.referenceRateBaseCurrency || !command.trip.referenceRateQuoteCurrency || !Number.isFinite(command.trip.referenceExchangeRate) || (command.trip.referenceExchangeRate ?? 0) <= 0)) throw new Error('trip reference currency and positive rate must be complete');
  if (command.trip.referenceRateBaseCurrency && command.trip.referenceRateBaseCurrency === command.trip.referenceRateQuoteCurrency) throw new Error('trip reference currencies must differ');
}

function referenceRateChanged(previous: Trip, next: Trip): boolean {
  return previous.referenceRateBaseCurrency !== next.referenceRateBaseCurrency
    || previous.referenceRateQuoteCurrency !== next.referenceRateQuoteCurrency
    || previous.referenceExchangeRate !== next.referenceExchangeRate;
}

function referenceRatePayload(trip: Trip): Readonly<{ baseCurrency: string | null; quoteCurrency: string | null; rate: number | null }> {
  return {
    baseCurrency: trip.referenceRateBaseCurrency ?? null,
    quoteCurrency: trip.referenceRateQuoteCurrency ?? null,
    rate: trip.referenceExchangeRate ?? null,
  };
}

function addTemplateOffset(isoDate: string, days?: number, months?: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (months) date.setUTCMonth(date.getUTCMonth() + months);
  if (days) date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function withoutDueOn(task: import('../../domain/types').Task): import('../../domain/types').Task {
  const next = { ...task } as { dueOn?: string } & import('../../domain/types').Task;
  delete next.dueOn;
  return next;
}

export async function saveTripWorkspace(repository: WorkspaceRepository, command: SaveTripWorkspaceCommand): Promise<{ client: Client; trip: Trip }> {
  validate(command);
  const client: Client = { ...command.client, lastSavedAt: command.recordedAt };
  const derivedTrip = { ...deriveTripInterval(command.trip, command.services), lastSavedAt: command.recordedAt };
  let savedTrip = derivedTrip;
  await repository.transact(async (tx) => {
    const previousTrip = await tx.getTrip(derivedTrip.id);
    const rateChanged = previousTrip ? referenceRateChanged(previousTrip, derivedTrip) : false;
    if (previousTrip?.referenceExchangeRate !== undefined && rateChanged && !command.referenceRateChangeConfirmed) {
      throw new Error('trip reference rate changes require explicit confirmation');
    }
    const trip = previousTrip?.referenceExchangeRateLockedAt || !derivedTrip.referenceExchangeRate
      ? derivedTrip
      : { ...derivedTrip, referenceExchangeRateLockedAt: command.recordedAt };
    savedTrip = trip;
    const events = [
      createActivityEvent({ aggregateType: 'client', aggregateId: client.id, type: 'client_workspace_saved', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { tripId: trip.id } }),
      createActivityEvent({ aggregateType: 'trip', aggregateId: trip.id, type: 'trip_workspace_saved', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { serviceCount: command.services.length, additionalItemCount: command.serviceAdditionalItems?.length ?? 0, noteCount: command.notes.length } }),
      ...(rateChanged ? [createActivityEvent({
        aggregateType: 'trip',
        aggregateId: trip.id,
        type: 'trip_reference_rate_changed',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: {
          previous: referenceRatePayload(previousTrip!),
          next: referenceRatePayload(trip),
          previousRate: previousTrip!.referenceExchangeRate ?? null,
          nextRate: trip.referenceExchangeRate ?? null,
          reason: command.referenceRateChangeReason?.trim() || null,
        },
      })] : []),
    ];
    await tx.putClient(client);
    await tx.putTrip(trip);
    for (const service of command.services) await tx.putService(service);
    for (const item of command.serviceAdditionalItems ?? []) await tx.putServiceAdditionalItem(item);
    for (const note of command.notes) await tx.putNote(note);
    const templateEvents = [];
    for (const task of await tx.listTasksForTrip(trip.id)) {
      if (task.source !== 'provider_template' || !task.templateSnapshot || task.status === 'completed') continue;
      if (task.dueDateSource === 'manual') {
        if (!task.requiresManualDateReview) await tx.putTask({ ...task, requiresManualDateReview: true });
        continue;
      }
      const anchor = task.templateSnapshot.relativeTo === 'trip_start' ? trip.effectiveStartOn : task.templateSnapshot.relativeTo === 'trip_end' ? trip.effectiveEndOn : undefined;
      const nextDueOn = anchor ? addTemplateOffset(anchor, task.templateSnapshot.offsetDays, task.templateSnapshot.offsetMonths) : undefined;
      if (task.dueOn === nextDueOn) continue;
      const recalculated = nextDueOn ? { ...task, dueOn: nextDueOn, dueDateSource: 'template' as const, requiresManualDateReview: false } : { ...withoutDueOn(task), dueDateSource: 'template' as const, requiresManualDateReview: false };
      await tx.putTask(recalculated);
      templateEvents.push(createActivityEvent({ aggregateType: 'task', aggregateId: task.id, type: 'task_template_date_recalculated', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { previousDueOn: task.dueOn ?? null, dueOn: nextDueOn ?? null } }));
    }
    if (rateChanged) {
      for (const commission of await tx.listCommissionsForTrip(trip.id)) {
        if (commission.projectionRateSource === 'commission_override') continue;
        await tx.putCommission({ ...commission, ...commissionProjectionFromTrip(trip, commission.expected) });
      }
    }
    await tx.putEvents(events);
    if (templateEvents.length > 0) await tx.putEvents(templateEvents);
  });
  return { client, trip: savedTrip };
}
