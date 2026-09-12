import type { ActivityEvent, Client, Commission, DeletedRecordReference, Lead, Payment, Provider, ProviderTaskTemplate, RichNote, Service, ServiceAdditionalItem, ServiceProvider, Task, Trip, WorkspaceConfiguration } from '../domain/types';
import { createDefaultWorkspaceConfiguration } from '../domain/workspaceConfiguration';

export const workspaceSnapshotVersion = 3 as const;

type SnapshotRows = Readonly<{
  exportedAt: string;
  leads: readonly Lead[];
  clients: readonly Client[];
  trips: readonly Trip[];
  services: readonly Service[];
  serviceProviders: readonly ServiceProvider[];
  providers: readonly Provider[];
  providerTaskTemplates: readonly ProviderTaskTemplate[];
  commissions: readonly Commission[];
  notes: readonly RichNote[];
  tasks: readonly Task[];
  payments: readonly Payment[];
  events: readonly ActivityEvent[];
}>;

export type WorkspaceSnapshot = SnapshotRows & Readonly<{
  schemaVersion: typeof workspaceSnapshotVersion;
  configuration: WorkspaceConfiguration;
  serviceAdditionalItems: readonly ServiceAdditionalItem[];
  deletedRecordReferences: readonly DeletedRecordReference[];
}>;

export type LegacyWorkspaceSnapshotV2 = SnapshotRows & Readonly<{
  schemaVersion: 2;
  configuration: WorkspaceConfiguration;
  serviceAdditionalItems: readonly ServiceAdditionalItem[];
}>;

export type LegacyWorkspaceSnapshotV1 = SnapshotRows & Readonly<{
  schemaVersion: 1;
}>;

export type LegacyWorkspaceSnapshot = LegacyWorkspaceSnapshotV1 | LegacyWorkspaceSnapshotV2;
export type WorkspaceSnapshotCounts = Readonly<Record<Exclude<keyof WorkspaceSnapshot, 'schemaVersion' | 'exportedAt' | 'configuration'>, number>>;

const entityCollections = ['leads', 'clients', 'trips', 'services', 'serviceProviders', 'serviceAdditionalItems', 'providers', 'providerTaskTemplates', 'commissions', 'notes', 'tasks', 'payments', 'events', 'deletedRecordReferences'] as const;

export function upgradeWorkspaceSnapshot(snapshot: WorkspaceSnapshot | LegacyWorkspaceSnapshot): WorkspaceSnapshot {
  if (snapshot.schemaVersion === workspaceSnapshotVersion) return snapshot;
  if (snapshot.schemaVersion === 2) return { ...snapshot, schemaVersion: workspaceSnapshotVersion, deletedRecordReferences: [] };
  if (snapshot.schemaVersion === 1) return { ...snapshot, schemaVersion: workspaceSnapshotVersion, configuration: createDefaultWorkspaceConfiguration(), serviceAdditionalItems: [], deletedRecordReferences: [] };
  throw new Error('backup schema version is not supported');
}

export function snapshotCounts(snapshot: WorkspaceSnapshot): WorkspaceSnapshotCounts {
  return Object.fromEntries(entityCollections.map((key) => [key, snapshot[key].length])) as WorkspaceSnapshotCounts;
}

function ids<T extends { id: string }>(records: readonly T[], name: string): Set<string> {
  const values = new Set(records.map((record) => record.id));
  if (values.size !== records.length) throw new Error(`backup contains duplicate ${name} ids`);
  return values;
}

function hasRecord(live: Set<string>, deleted: Set<string>, id: string | undefined): boolean {
  return !id || live.has(id) || deleted.has(id);
}

export function assertWorkspaceSnapshot(snapshot: WorkspaceSnapshot): void {
  if (snapshot.schemaVersion !== workspaceSnapshotVersion) throw new Error('backup schema version is not supported');
  const leadIds = ids(snapshot.leads, 'lead'); const clientIds = ids(snapshot.clients, 'client'); const tripIds = ids(snapshot.trips, 'trip'); const serviceIds = ids(snapshot.services, 'service'); const componentIds = ids(snapshot.serviceProviders, 'service provider'); ids(snapshot.serviceAdditionalItems, 'service additional item'); const providerIds = ids(snapshot.providers, 'provider'); const taskIds = ids(snapshot.tasks, 'task'); const commissionIds = ids(snapshot.commissions, 'commission'); const paymentIds = ids(snapshot.payments, 'payment');
  const deletedByKind = new Map<string, Set<string>>(); const deletedKeys = new Set<string>();
  for (const reference of snapshot.deletedRecordReferences) {
    if (reference.key !== `${reference.kind}:${reference.id}` || deletedKeys.has(reference.key)) throw new Error('backup contains invalid deleted record references');
    deletedKeys.add(reference.key);
    const idsForKind = deletedByKind.get(reference.kind) ?? new Set<string>();
    idsForKind.add(reference.id); deletedByKind.set(reference.kind, idsForKind);
  }
  const deleted = (kind: string) => deletedByKind.get(kind) ?? new Set<string>();
  for (const [kind, live] of [['lead', leadIds], ['client', clientIds], ['trip', tripIds], ['service', serviceIds], ['provider', providerIds], ['payment', paymentIds], ['task', taskIds], ['commission', commissionIds]] as const) for (const id of deleted(kind)) if (live.has(id)) throw new Error('backup contains both live and deleted record references');
  for (const lead of snapshot.leads) if (!hasRecord(clientIds, deleted('client'), lead.clientId) || !hasRecord(tripIds, deleted('trip'), lead.tripId)) throw new Error('backup has an orphaned lead relationship');
  for (const trip of snapshot.trips) if (!hasRecord(leadIds, deleted('lead'), trip.leadId) || !hasRecord(clientIds, deleted('client'), trip.clientId)) throw new Error('backup has an orphaned trip relationship');
  for (const service of snapshot.services) if (!hasRecord(tripIds, deleted('trip'), service.tripId)) throw new Error('backup has an orphaned service relationship');
  for (const component of snapshot.serviceProviders) if (!hasRecord(serviceIds, deleted('service'), component.serviceId) || !hasRecord(providerIds, deleted('provider'), component.providerId)) throw new Error('backup has an orphaned provider component relationship');
  for (const item of snapshot.serviceAdditionalItems) if (!hasRecord(serviceIds, deleted('service'), item.serviceId)) throw new Error('backup has an orphaned service additional item relationship');
  for (const template of snapshot.providerTaskTemplates) if (!hasRecord(providerIds, deleted('provider'), template.providerId)) throw new Error('backup has an orphaned task template relationship');
  for (const commission of snapshot.commissions) if (!hasRecord(tripIds, deleted('trip'), commission.tripId) || !hasRecord(providerIds, deleted('provider'), commission.providerId) || (commission.serviceProviderId && !componentIds.has(commission.serviceProviderId))) throw new Error('backup has an orphaned commission relationship');
  for (const note of snapshot.notes) if ((note.ownerType === 'client' && !hasRecord(clientIds, deleted('client'), note.ownerId)) || (note.ownerType === 'trip' && !hasRecord(tripIds, deleted('trip'), note.ownerId))) throw new Error('backup has an orphaned note relationship');
  for (const task of snapshot.tasks) if (!hasRecord(leadIds, deleted('lead'), task.leadId) || !hasRecord(tripIds, deleted('trip'), task.tripId) || (task.serviceProviderId && !componentIds.has(task.serviceProviderId)) || !hasRecord(commissionIds, deleted('commission'), task.commissionId)) throw new Error('backup has an orphaned task relationship');
  for (const payment of snapshot.payments) if (!hasRecord(tripIds, deleted('trip'), payment.tripId) || (payment.serviceProviderId && !componentIds.has(payment.serviceProviderId))) throw new Error('backup has an orphaned payment relationship');
  const aggregateIds = new Map([['lead', leadIds], ['client', clientIds], ['trip', tripIds], ['service', serviceIds], ['provider', providerIds], ['payment', paymentIds], ['task', taskIds], ['commission', commissionIds]]);
  for (const event of snapshot.events) if (!hasRecord(aggregateIds.get(event.aggregateType) ?? new Set<string>(), deleted(event.aggregateType), event.aggregateId)) throw new Error('backup has an orphaned activity event');
}
