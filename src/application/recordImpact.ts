import type { WorkspaceSnapshot } from './workspaceSnapshot';

export type ManagedRecordKind = 'lead' | 'client' | 'trip' | 'provider' | 'service' | 'payment' | 'commission' | 'task';

export type ManagedRecordRef = Readonly<{
  kind: ManagedRecordKind;
  id: string;
}>;

export type DependencySummary = Readonly<{
  label: string;
  count: number;
}>;

export type RecordImpact = Readonly<{
  target: ManagedRecordRef;
  title: string;
  dependencies: readonly DependencySummary[];
  canDelete: boolean;
}>;

type Dependency = Readonly<{ label: string; count: number }>;

function dependencies(items: readonly Dependency[]): readonly DependencySummary[] {
  return items.filter((item) => item.count > 0);
}

function eventCount(workspace: WorkspaceSnapshot, target: ManagedRecordRef): number {
  return workspace.events.filter((event) => event.aggregateType === target.kind && event.aggregateId === target.id).length;
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
  const event = { label: 'Evento de actividad', count: eventCount(workspace, target) };
  if (target.kind === 'client') return dependencies([
    { label: 'Lead', count: workspace.leads.filter((item) => item.clientId === target.id).length },
    { label: 'Viaje', count: workspace.trips.filter((item) => item.clientId === target.id).length },
    { label: 'Nota', count: workspace.notes.filter((item) => item.ownerType === 'client' && item.ownerId === target.id).length },
    event,
  ]);
  if (target.kind === 'lead') return dependencies([
    { label: 'Viaje', count: workspace.trips.filter((item) => item.leadId === target.id).length },
    { label: 'Tarea', count: workspace.tasks.filter((item) => item.leadId === target.id).length },
    event,
  ]);
  if (target.kind === 'trip') return dependencies([
    { label: 'Lead', count: workspace.leads.filter((item) => item.tripId === target.id).length },
    { label: 'Servicio', count: workspace.services.filter((item) => item.tripId === target.id).length },
    { label: 'Pago', count: workspace.payments.filter((item) => item.tripId === target.id).length },
    { label: 'Comisión', count: workspace.commissions.filter((item) => item.tripId === target.id).length },
    { label: 'Nota', count: workspace.notes.filter((item) => item.ownerType === 'trip' && item.ownerId === target.id).length },
    { label: 'Tarea', count: workspace.tasks.filter((item) => item.tripId === target.id).length },
    event,
  ]);
  if (target.kind === 'provider') return dependencies([
    { label: 'Asignación de proveedor', count: workspace.serviceProviders.filter((item) => item.providerId === target.id).length },
    { label: 'Plantilla de tarea', count: workspace.providerTaskTemplates.filter((item) => item.providerId === target.id).length },
    { label: 'Comisión', count: workspace.commissions.filter((item) => item.providerId === target.id).length },
    event,
  ]);
  if (target.kind === 'service') return dependencies([
    { label: 'Asignación de proveedor', count: workspace.serviceProviders.filter((item) => item.serviceId === target.id).length },
    { label: 'Concepto adicional', count: workspace.serviceAdditionalItems.filter((item) => item.serviceId === target.id).length },
    event,
  ]);
  if (target.kind === 'payment') return dependencies([event]);
  if (target.kind === 'commission') return dependencies([event]);
  if (target.kind === 'task') return dependencies([event]);
  return [];
}

export function analyzeRecordImpact(workspace: WorkspaceSnapshot, target: ManagedRecordRef): RecordImpact {
  const result = dependencySummary(workspace, target);
  return { target, title: requireTitle(workspace, target), dependencies: result, canDelete: result.length === 0 };
}
