import type { WorkspaceSnapshot } from './workspaceSnapshot';

export type ManagedRecordKind = 'lead' | 'client' | 'trip' | 'provider' | 'service' | 'payment' | 'commission' | 'task';

export type ManagedRecordRef = Readonly<{
  kind: ManagedRecordKind;
  id: string;
}>;

export type RecordDeleteOptions = Readonly<{
  /** Removes the target's activity history only when the operator opted into it. */
  removeOwnEvents?: boolean;
  /** Optimistic concurrency token returned with the displayed impact. */
  expectedFingerprint?: string;
}>;

export type ImpactItem = Readonly<{
  id: string;
  /** A human record label. Activity events intentionally leave this blank. */
  label: string;
  /** Storage event code, translated only by presentation code. */
  eventType?: string;
  /** ISO timestamp retained for the fixed operational date/time format. */
  occurredAt?: string;
}>;

export type DependencySummary = Readonly<{
  label: string;
  count: number;
  items?: readonly ImpactItem[];
}>;

export type RecordImpact = Readonly<{
  target: ManagedRecordRef;
  title: string;
  dependencies: readonly DependencySummary[];
  canDelete: boolean;
  fingerprint: string;
}>;

type Dependency = Readonly<{ label: string; items: readonly ImpactItem[] }>;

function dependencies(items: readonly Dependency[]): readonly DependencySummary[] {
  return items.filter((item) => item.items.length > 0).map((item) => ({ label: item.label, count: item.items.length, items: item.items }));
}

function labels<T extends { id: string }>(records: readonly T[], getLabel: (record: T) => string): readonly ImpactItem[] {
  return records.map((record) => ({ id: record.id, label: getLabel(record) }));
}

function eventLabels(workspace: WorkspaceSnapshot, target: ManagedRecordRef): readonly ImpactItem[] {
  return workspace.events
    .filter((event) => event.aggregateType === target.kind && event.aggregateId === target.id)
    .map((event) => ({ id: event.id, label: '', eventType: event.type, occurredAt: event.occurredAt }));
}

function requireTitle(workspace: WorkspaceSnapshot, target: ManagedRecordRef): string {
  if (target.kind === 'lead') {
    const record = workspace.leads.find((item) => item.id === target.id);
    if (!record) throw new Error('managed record not found');
    return record.name;
  }
  if (target.kind === 'client') {
    const record = workspace.clients.find((item) => item.id === target.id);
    if (!record) throw new Error('managed record not found');
    return record.name;
  }
  if (target.kind === 'provider') {
    const record = workspace.providers.find((item) => item.id === target.id);
    if (!record) throw new Error('managed record not found');
    return record.name;
  }
  if (target.kind === 'service') {
    const record = workspace.services.find((item) => item.id === target.id);
    if (!record) throw new Error('managed record not found');
    return record.name;
  }
  if (target.kind === 'task') {
    const record = workspace.tasks.find((item) => item.id === target.id);
    if (!record) throw new Error('managed record not found');
    return record.title;
  }
  const record = target.kind === 'trip' ? workspace.trips.find((item) => item.id === target.id)
    : target.kind === 'payment' ? workspace.payments.find((item) => item.id === target.id)
      : workspace.commissions.find((item) => item.id === target.id);
  if (!record) throw new Error('managed record not found');
  return target.kind === 'trip' ? 'Viaje' : target.kind === 'payment' ? 'Pago' : 'Comisión';
}

function dependencySummary(workspace: WorkspaceSnapshot, target: ManagedRecordRef): readonly DependencySummary[] {
  const event = { label: 'Evento de actividad', items: eventLabels(workspace, target) };
  if (target.kind === 'client') return dependencies([
    { label: 'Lead', items: labels(workspace.leads.filter((item) => item.clientId === target.id), (item) => item.name) },
    { label: 'Viaje', items: labels(workspace.trips.filter((item) => item.clientId === target.id), (item) => `Viaje ${item.id}`) },
    { label: 'Nota', items: labels(workspace.notes.filter((item) => item.ownerType === 'client' && item.ownerId === target.id), (item) => item.content.slice(0, 80) || 'Nota sin contenido') },
    event,
  ]);
  if (target.kind === 'lead') return dependencies([
    { label: 'Cliente', items: labels(workspace.clients.filter((item) => item.id === workspace.leads.find((lead) => lead.id === target.id)?.clientId), (item) => item.name) },
    { label: 'Viaje', items: labels(workspace.trips.filter((item) => item.leadId === target.id), (item) => `Viaje ${item.id}`) },
    { label: 'Tarea', items: labels(workspace.tasks.filter((item) => item.leadId === target.id), (item) => item.title) },
    event,
  ]);
  if (target.kind === 'trip') {
    const serviceIds = new Set(workspace.services.filter((item) => item.tripId === target.id).map((item) => item.id));
    const componentIds = new Set(workspace.serviceProviders.filter((item) => serviceIds.has(item.serviceId)).map((item) => item.id));
    return dependencies([
    { label: 'Lead', items: labels(workspace.leads.filter((item) => item.tripId === target.id), (item) => item.name) },
    { label: 'Servicio', items: labels(workspace.services.filter((item) => item.tripId === target.id), (item) => item.name) },
    { label: 'Asignación de proveedor', items: labels(workspace.serviceProviders.filter((item) => serviceIds.has(item.serviceId)), (item) => workspace.providers.find((provider) => provider.id === item.providerId)?.name ?? 'Proveedor eliminado') },
    { label: 'Concepto adicional', items: labels(workspace.serviceAdditionalItems.filter((item) => serviceIds.has(item.serviceId)), (item) => item.label) },
    { label: 'Pago', items: labels(workspace.payments.filter((item) => item.tripId === target.id), (item) => `Pago ${item.id}`) },
    { label: 'Comisión', items: labels(workspace.commissions.filter((item) => item.tripId === target.id), (item) => `Comisión ${item.id}`) },
    { label: 'Nota', items: labels(workspace.notes.filter((item) => item.ownerType === 'trip' && item.ownerId === target.id), (item) => item.content.slice(0, 80) || 'Nota sin contenido') },
    { label: 'Tarea', items: labels(workspace.tasks.filter((item) => item.tripId === target.id || (item.serviceProviderId !== undefined && componentIds.has(item.serviceProviderId))), (item) => item.title) },
    event,
  ]);
  }
  if (target.kind === 'provider') {
    const componentIds = new Set(workspace.serviceProviders.filter((item) => item.providerId === target.id).map((item) => item.id));
    return dependencies([
    { label: 'Asignación de proveedor', items: labels(workspace.serviceProviders.filter((item) => item.providerId === target.id), (item) => workspace.services.find((service) => service.id === item.serviceId)?.name ?? `Servicio ${item.serviceId}`) },
    { label: 'Plantilla de tarea', items: labels(workspace.providerTaskTemplates.filter((item) => item.providerId === target.id), (item) => item.title) },
    { label: 'Comisión', items: labels(workspace.commissions.filter((item) => item.providerId === target.id), (item) => `Comisión ${item.id}`) },
    { label: 'Tarea', items: labels(workspace.tasks.filter((item) => item.serviceProviderId && componentIds.has(item.serviceProviderId)), (item) => item.title) },
    event,
  ]);
  }
  if (target.kind === 'service') {
    const componentIds = new Set(workspace.serviceProviders.filter((item) => item.serviceId === target.id).map((item) => item.id));
    return dependencies([
    { label: 'Asignación de proveedor', items: labels(workspace.serviceProviders.filter((item) => item.serviceId === target.id), (item) => workspace.providers.find((provider) => provider.id === item.providerId)?.name ?? `Proveedor ${item.providerId}`) },
    { label: 'Concepto adicional', items: labels(workspace.serviceAdditionalItems.filter((item) => item.serviceId === target.id), (item) => item.label) },
    { label: 'Comisión', items: labels(workspace.commissions.filter((item) => item.serviceProviderId && componentIds.has(item.serviceProviderId)), (item) => `Comisión ${item.id}`) },
    { label: 'Tarea', items: labels(workspace.tasks.filter((item) => item.serviceProviderId && componentIds.has(item.serviceProviderId)), (item) => item.title) },
    event,
  ]);
  }
  if (target.kind === 'payment') return dependencies([event]);
  if (target.kind === 'commission') return dependencies([
    { label: 'Tarea', items: labels(workspace.tasks.filter((item) => item.commissionId === target.id), (item) => item.title) },
    event,
  ]);
  if (target.kind === 'task') return dependencies([event]);
  return [];
}

export function analyzeRecordImpact(workspace: WorkspaceSnapshot, target: ManagedRecordRef): RecordImpact {
  const result = dependencySummary(workspace, target);
  const title = requireTitle(workspace, target);
  const fingerprint = JSON.stringify({
    target,
    title,
    dependencies: result.map((dependency) => ({
      label: dependency.label,
      items: [...(dependency.items ?? [])].map((item) => ({ ...item })).sort((left, right) => left.id.localeCompare(right.id)),
    })).sort((left, right) => left.label.localeCompare(right.label)),
  });
  return { target, title, dependencies: result, canDelete: result.length === 0, fingerprint };
}
