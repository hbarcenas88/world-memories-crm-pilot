import { describe, expect, it } from 'vitest';
import { analyzeRecordImpact } from '../../src/application/recordImpact';
import type { WorkspaceSnapshot } from '../../src/application/workspaceSnapshot';
import { createDefaultWorkspaceConfiguration } from '../../src/domain/workspaceConfiguration';

function emptyWorkspace(): WorkspaceSnapshot {
  return {
    schemaVersion: 3,
    exportedAt: '2026-08-29T00:00:00.000Z',
    configuration: createDefaultWorkspaceConfiguration(),
    leads: [],
    clients: [],
    trips: [],
    services: [],
    serviceProviders: [],
    serviceAdditionalItems: [],
    providers: [],
    providerTaskTemplates: [],
    commissions: [],
    notes: [],
    tasks: [],
    payments: [],
    events: [],
    deletedRecordReferences: [],
  };
}

describe('analyzeRecordImpact', () => {
  it('summarizes linked Client records for an informed deletion decision', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      clients: [{ id: 'client-1', name: 'Familia prueba', createdAt: '2026-08-01T00:00:00.000Z' }],
      leads: [{ id: 'lead-1', name: 'Consulta prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: '2026-08-02T00:00:00.000Z' }],
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-03T00:00:00.000Z' }],
      events: [{ id: 'event-1', aggregateType: 'client', aggregateId: 'client-1', type: 'client_workspace_saved', occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', payload: {} }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'client', id: 'client-1' })).toMatchObject({
      target: { kind: 'client', id: 'client-1' },
      title: 'Familia prueba',
      dependencies: [
        { label: 'Lead', count: 1 },
        { label: 'Viaje', count: 1 },
        { label: 'Evento de actividad', count: 1 },
      ],
      canDelete: false,
    });
    expect(analyzeRecordImpact(workspace, { kind: 'client', id: 'client-1' }).dependencies).toContainEqual(expect.objectContaining({
      label: 'Lead', items: [{ id: 'lead-1', label: 'Consulta prueba' }],
    }));
  });

  it('reports a payment activity history that the operator may retain or remove', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      payments: [{ id: 'payment-1', tripId: 'trip-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', status: 'received', source: 'customer_payment' }],
      events: [{ id: 'event-1', aggregateType: 'payment', aggregateId: 'payment-1', type: 'payment_recorded', occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', payload: {} }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'payment', id: 'payment-1' })).toMatchObject({
      target: { kind: 'payment', id: 'payment-1' },
      title: 'Pago',
      dependencies: [{ label: 'Evento de actividad', count: 1 }],
      canDelete: false,
    });
  });

  it('keeps event presentation metadata separate from the stored technical event code', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      clients: [{ id: 'client-1', name: 'Familia prueba', createdAt: '2026-08-01T00:00:00.000Z' }],
      events: [{ id: 'event-1', aggregateType: 'client', aggregateId: 'client-1', type: 'client_workspace_saved', occurredAt: '2026-08-04T15:30:00.000Z', recordedAt: '2026-08-04T15:30:00.000Z', payload: { private: 'not exposed' } }],
    };

    const eventGroup = analyzeRecordImpact(workspace, { kind: 'client', id: 'client-1' }).dependencies
      .find((dependency) => dependency.label === 'Evento de actividad');

    expect(eventGroup?.items).toEqual([expect.objectContaining({
      id: 'event-1',
      eventType: 'client_workspace_saved',
      occurredAt: '2026-08-04T15:30:00.000Z',
    })]);
    expect(eventGroup?.items?.[0]?.label).not.toContain('client_workspace_saved');
    expect(eventGroup?.items?.[0]?.label).not.toContain('not exposed');
  });

  it('reports a Service when provider components or additional concepts remain attached', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-03T00:00:00.000Z' }],
      serviceAdditionalItems: [{ id: 'item-1', serviceId: 'service-1', label: 'Seguro', amount: 80, currency: 'USD', createdAt: '2026-08-03T00:00:00.000Z' }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'service', id: 'service-1' })).toMatchObject({
      dependencies: [{ label: 'Concepto adicional', count: 1 }],
      canDelete: false,
    });
  });

  it('includes indirect component tasks and commissions in a Service impact rather than hiding them', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-03T00:00:00.000Z' }],
      serviceProviders: [{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-08-03T00:00:00.000Z' }],
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', serviceProviderId: 'component-1', expected: { amount: 50, currency: 'USD' }, status: 'expected', createdAt: '2026-08-03T00:00:00.000Z' }],
      tasks: [{ id: 'task-1', title: 'Confirmar habitación', required: false, status: 'open', serviceProviderId: 'component-1', createdAt: '2026-08-03T00:00:00.000Z' }],
    };

    const impact = analyzeRecordImpact(workspace, { kind: 'service', id: 'service-1' });
    expect(impact.dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Asignación de proveedor', count: 1 }),
      expect.objectContaining({ label: 'Comisión', count: 1 }),
      expect.objectContaining({ label: 'Tarea', items: [{ id: 'task-1', label: 'Confirmar habitación' }] }),
    ]));
  });

  it('lists tasks linked directly to a commission in its concrete impact preview', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 50, currency: 'USD' }, status: 'expected', createdAt: '2026-08-03T00:00:00.000Z' }],
      tasks: [{ id: 'task-1', title: 'Cobrar comisión', required: false, status: 'open', commissionId: 'commission-1', createdAt: '2026-08-03T00:00:00.000Z' }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'commission', id: 'commission-1' })).toMatchObject({
      dependencies: [{ label: 'Tarea', count: 1 }],
      canDelete: false,
    });
  });

  it('changes its deterministic fingerprint when a related record changes after preview', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 50, currency: 'USD' }, status: 'expected', createdAt: '2026-08-03T00:00:00.000Z' }],
      tasks: [{ id: 'task-1', title: 'Cobrar comisión', required: false, status: 'open', commissionId: 'commission-1', createdAt: '2026-08-03T00:00:00.000Z' }],
    };
    const original = analyzeRecordImpact(workspace, { kind: 'commission', id: 'commission-1' });
    const changed = analyzeRecordImpact({ ...workspace, tasks: [...workspace.tasks, { id: 'task-2', title: 'Revisar pago', required: false, status: 'open', commissionId: 'commission-1', createdAt: '2026-08-03T00:00:00.000Z' }] }, { kind: 'commission', id: 'commission-1' });

    expect(original.fingerprint).not.toBe(changed.fingerprint);
  });
});
