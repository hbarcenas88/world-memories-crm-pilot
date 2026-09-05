import type { Client, Commission, Lead, Provider, RichNote, Service, ServiceProvider, Task, Trip } from '../../domain/types';

export type SearchResult = Readonly<{ id: string; kind: 'client' | 'lead' | 'trip' | 'provider' | 'task' | 'commission'; label: string; context?: string }>;
type SearchWorkspace = Readonly<{ clients: readonly Client[]; leads: readonly Lead[]; trips: readonly Trip[]; providers: readonly Provider[]; tasks: readonly Task[]; commissions: readonly Commission[]; notes?: readonly RichNote[]; services?: readonly Service[]; serviceProviders?: readonly ServiceProvider[] }>;

function normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function matches(query: string, ...values: readonly (string | undefined)[]): boolean { return values.some((value) => value && normalize(value).includes(query)); }

export function searchWorkspace(queryText: string, workspace: SearchWorkspace): readonly SearchResult[] {
  const query = normalize(queryText);
  if (!query) return [];
  const clientNameById = new Map(workspace.clients.map((client) => [client.id, client.name]));
  const notesByTripId = new Map((workspace.notes ?? []).filter((note) => note.ownerType === 'trip').map((note) => [note.ownerId, note.content]));
  const serviceToTrip = new Map((workspace.services ?? []).map((service) => [service.id, service.tripId]));
  const locatorsByTripId = new Map<string, string[]>();
  for (const component of workspace.serviceProviders ?? []) {
    const tripId = serviceToTrip.get(component.serviceId);
    if (tripId && component.reservationLocator) locatorsByTripId.set(tripId, [...(locatorsByTripId.get(tripId) ?? []), component.reservationLocator]);
  }
  return [
    ...workspace.clients.filter((client) => matches(query, client.name)).map((client) => ({ id: client.id, kind: 'client' as const, label: client.name })),
    ...workspace.leads.filter((lead) => matches(query, lead.name, lead.destination, lead.commercialNote)).map((lead) => ({ id: lead.id, kind: 'lead' as const, label: lead.name, ...(lead.commercialNote ? { context: lead.commercialNote } : {}) })),
    ...workspace.trips.filter((trip) => matches(query, clientNameById.get(trip.clientId), trip.effectiveStartOn, trip.effectiveEndOn, notesByTripId.get(trip.id), ...(locatorsByTripId.get(trip.id) ?? []))).map((trip) => ({ id: trip.id, kind: 'trip' as const, label: `Viaje: ${clientNameById.get(trip.clientId) ?? trip.clientId}`, ...(notesByTripId.get(trip.id) ? { context: notesByTripId.get(trip.id) } : locatorsByTripId.get(trip.id)?.[0] ? { context: locatorsByTripId.get(trip.id)?.[0] } : {}) })),
    ...workspace.providers.filter((provider) => matches(query, provider.name, ...(provider.references ?? []))).map((provider) => ({ id: provider.id, kind: 'provider' as const, label: provider.name })),
    ...workspace.tasks.filter((task) => matches(query, task.title)).map((task) => ({ id: task.id, kind: 'task' as const, label: task.title })),
    ...workspace.commissions.filter((commission) => matches(query, commission.trackingReference)).map((commission) => ({ id: commission.id, kind: 'commission' as const, label: commission.trackingReference ?? 'Comisión' })),
  ];
}
