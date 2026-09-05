import type { ActivityEvent, Client, Commission, Lead, Payment, Provider, ProviderTaskTemplate, RichNote, Service, ServiceAdditionalItem, ServiceProvider, Task, Trip, WorkspaceConfiguration } from '../domain/types';
import { createDefaultWorkspaceConfiguration } from '../domain/workspaceConfiguration';

export const workspaceSnapshotVersion = 2 as const;

export type WorkspaceSnapshot = Readonly<{
  schemaVersion: typeof workspaceSnapshotVersion;
  exportedAt: string;
  configuration: WorkspaceConfiguration;
  leads: readonly Lead[];
  clients: readonly Client[];
  trips: readonly Trip[];
  services: readonly Service[];
  serviceProviders: readonly ServiceProvider[];
  serviceAdditionalItems: readonly ServiceAdditionalItem[];
  providers: readonly Provider[];
  providerTaskTemplates: readonly ProviderTaskTemplate[];
  commissions: readonly Commission[];
  notes: readonly RichNote[];
  tasks: readonly Task[];
  payments: readonly Payment[];
  events: readonly ActivityEvent[];
}>;

export type LegacyWorkspaceSnapshot = Readonly<Omit<WorkspaceSnapshot, 'schemaVersion' | 'configuration' | 'serviceAdditionalItems'> & { schemaVersion: 1 }>;
export type WorkspaceSnapshotCounts = Readonly<Record<Exclude<keyof WorkspaceSnapshot, 'schemaVersion' | 'exportedAt' | 'configuration'>, number>>;

const entityCollections = ['leads', 'clients', 'trips', 'services', 'serviceProviders', 'serviceAdditionalItems', 'providers', 'providerTaskTemplates', 'commissions', 'notes', 'tasks', 'payments', 'events'] as const;

export function upgradeWorkspaceSnapshot(snapshot: WorkspaceSnapshot | LegacyWorkspaceSnapshot): WorkspaceSnapshot {
  if (snapshot.schemaVersion === workspaceSnapshotVersion) return snapshot;
  if (snapshot.schemaVersion !== 1) throw new Error('backup schema version is not supported');
  return { ...snapshot, schemaVersion: workspaceSnapshotVersion, configuration: createDefaultWorkspaceConfiguration(), serviceAdditionalItems: [] };
}

export function snapshotCounts(snapshot: WorkspaceSnapshot): WorkspaceSnapshotCounts {
  return Object.fromEntries(entityCollections.map((key) => [key, snapshot[key].length])) as WorkspaceSnapshotCounts;
}

function ids<T extends { id: string }>(records: readonly T[], name: string): Set<string> {
  const values = new Set(records.map((record) => record.id));
  if (values.size !== records.length) throw new Error(`backup contains duplicate ${name} ids`);
  return values;
}

export function assertWorkspaceSnapshot(snapshot: WorkspaceSnapshot): void {
  if (snapshot.schemaVersion !== workspaceSnapshotVersion) throw new Error('backup schema version is not supported');
  const leadIds = ids(snapshot.leads, 'lead');
  const clientIds = ids(snapshot.clients, 'client');
  const tripIds = ids(snapshot.trips, 'trip');
  const serviceIds = ids(snapshot.services, 'service');
  const componentIds = ids(snapshot.serviceProviders, 'service provider');
  ids(snapshot.serviceAdditionalItems, 'service additional item');
  const providerIds = ids(snapshot.providers, 'provider');
  const taskIds = ids(snapshot.tasks, 'task');
  const commissionIds = ids(snapshot.commissions, 'commission');
  const paymentIds = ids(snapshot.payments, 'payment');
  const aggregateIds = new Map([['lead', leadIds], ['client', clientIds], ['trip', tripIds], ['service', serviceIds], ['provider', providerIds], ['payment', paymentIds], ['task', taskIds], ['commission', commissionIds]]);
  for (const lead of snapshot.leads) if ((lead.clientId && !clientIds.has(lead.clientId)) || (lead.tripId && !tripIds.has(lead.tripId))) throw new Error('backup has an orphaned lead relationship');
  for (const trip of snapshot.trips) if (!leadIds.has(trip.leadId) || !clientIds.has(trip.clientId)) throw new Error('backup has an orphaned trip relationship');
  for (const service of snapshot.services) if (!tripIds.has(service.tripId)) throw new Error('backup has an orphaned service relationship');
  for (const component of snapshot.serviceProviders) if (!serviceIds.has(component.serviceId) || !providerIds.has(component.providerId)) throw new Error('backup has an orphaned provider component relationship');
  for (const item of snapshot.serviceAdditionalItems) if (!serviceIds.has(item.serviceId)) throw new Error('backup has an orphaned service additional item relationship');
  for (const template of snapshot.providerTaskTemplates) if (!providerIds.has(template.providerId)) throw new Error('backup has an orphaned task template relationship');
  for (const commission of snapshot.commissions) if (!tripIds.has(commission.tripId) || !providerIds.has(commission.providerId) || (commission.serviceProviderId && !componentIds.has(commission.serviceProviderId))) throw new Error('backup has an orphaned commission relationship');
  for (const note of snapshot.notes) if ((note.ownerType === 'client' && !clientIds.has(note.ownerId)) || (note.ownerType === 'trip' && !tripIds.has(note.ownerId))) throw new Error('backup has an orphaned note relationship');
  for (const task of snapshot.tasks) if ((task.leadId && !leadIds.has(task.leadId)) || (task.tripId && !tripIds.has(task.tripId)) || (task.serviceProviderId && !componentIds.has(task.serviceProviderId)) || (task.commissionId && !commissionIds.has(task.commissionId))) throw new Error('backup has an orphaned task relationship');
  for (const payment of snapshot.payments) if (!tripIds.has(payment.tripId) || (payment.serviceProviderId && !componentIds.has(payment.serviceProviderId))) throw new Error('backup has an orphaned payment relationship');
  for (const event of snapshot.events) if (!aggregateIds.get(event.aggregateType)?.has(event.aggregateId)) throw new Error('backup has an orphaned activity event');
}
