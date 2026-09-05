import { describe, expect, it } from 'vitest';
import { analyzeRecordImpact } from '../../src/application/recordImpact';
import type { WorkspaceSnapshot } from '../../src/application/workspaceSnapshot';
import { createDefaultWorkspaceConfiguration } from '../../src/domain/workspaceConfiguration';

function emptyWorkspace(): WorkspaceSnapshot {
  return {
    schemaVersion: 2,
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
  };
}

describe('analyzeRecordImpact', () => {
  it('blocks deletion of a Client and summarizes its linked records', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      clients: [{ id: 'client-1', name: 'Familia prueba', createdAt: '2026-08-01T00:00:00.000Z' }],
      leads: [{ id: 'lead-1', name: 'Consulta prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: '2026-08-02T00:00:00.000Z' }],
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-03T00:00:00.000Z' }],
      events: [{ id: 'event-1', aggregateType: 'client', aggregateId: 'client-1', type: 'client_workspace_saved', occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', payload: {} }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'client', id: 'client-1' })).toEqual({
      target: { kind: 'client', id: 'client-1' },
      title: 'Familia prueba',
      dependencies: [
        { label: 'Lead', count: 1 },
        { label: 'Viaje', count: 1 },
        { label: 'Evento de actividad', count: 1 },
      ],
      canDelete: false,
    });
  });

  it('blocks deletion of a payment when its activity history would be left orphaned', () => {
    const workspace: WorkspaceSnapshot = {
      ...emptyWorkspace(),
      payments: [{ id: 'payment-1', tripId: 'trip-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', status: 'received', source: 'customer_payment' }],
      events: [{ id: 'event-1', aggregateType: 'payment', aggregateId: 'payment-1', type: 'payment_recorded', occurredAt: '2026-08-04T00:00:00.000Z', recordedAt: '2026-08-04T00:00:00.000Z', payload: {} }],
    };

    expect(analyzeRecordImpact(workspace, { kind: 'payment', id: 'payment-1' })).toEqual({
      target: { kind: 'payment', id: 'payment-1' },
      title: 'Pago',
      dependencies: [{ label: 'Evento de actividad', count: 1 }],
      canDelete: false,
    });
  });

  it('blocks deletion of a Service when provider components or additional concepts remain attached', () => {
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
});
