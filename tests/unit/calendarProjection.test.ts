import { describe, expect, it } from 'vitest';
import { projectCalendar } from '../../src/features/calendar/calendarProjection';

describe('projectCalendar', () => {
  it('projects effective trips as intervals and dated operational milestones as point events', () => {
    const projections = projectCalendar({
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-10', effectiveEndOn: '2026-09-16' }],
      tasks: [{ id: 'task-1', title: 'Confirmar pasajeros', required: true, dueOn: '2026-09-07', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }],
      serviceProviders: [{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', customerBalanceDueOn: '2026-09-08', commissionStatus: 'with_commission', createdAt: '2026-08-20T00:00:00.000Z' }],
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, dueOn: '2026-10-01', status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }],
      payments: [],
    });

    expect(projections).toEqual([
      { id: 'task:task-1', kind: 'task', startOn: '2026-09-07', target: { type: 'task_context', id: 'task-1' } },
      { id: 'customer_payment:component-1', kind: 'customer_payment', startOn: '2026-09-08', target: { type: 'trip_workspace', id: 'trip-1' }, balanceStatus: 'unknown_total' },
      { id: 'trip:trip-1', kind: 'trip', startOn: '2026-09-10', endOn: '2026-09-16', target: { type: 'trip_workspace', id: 'trip-1' } },
      { id: 'commission:commission-1', kind: 'commission', startOn: '2026-10-01', target: { type: 'commission_section', id: 'commission-1' } },
    ]);
  });

  it('does not create calendar entries when their source date or relationship is absent', () => {
    expect(projectCalendar({
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-10' }],
      tasks: [{ id: 'task-1', title: 'Sin fecha', required: false, status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }],
      services: [],
      serviceProviders: [{ id: 'component-1', serviceId: 'missing-service', providerId: 'provider-1', currency: 'USD', customerBalanceDueOn: '2026-09-08', commissionStatus: 'with_commission', createdAt: '2026-08-20T00:00:00.000Z' }],
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }],
      payments: [],
    })).toEqual([]);
  });

  it('omits a customer balance once its component is fully paid and does not cross-sum currencies', () => {
    const base = {
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active' as const, createdAt: '2026-08-20T00:00:00.000Z' }],
      tasks: [], commissions: [],
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active' as const, createdAt: '2026-08-20T00:00:00.000Z' }],
      serviceProviders: [{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD' as const, saleAmount: 900, customerBalanceDueOn: '2026-09-08', commissionStatus: 'without_commission' as const, createdAt: '2026-08-20T00:00:00.000Z' }],
    };
    expect(projectCalendar({ ...base, payments: [{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 900, currency: 'USD' }, occurredAt: '2026-09-01T12:00:00.000Z', recordedAt: '2026-09-01T12:00:00.000Z', source: 'customer_payment', status: 'received' }] })).toEqual([]);
    expect(projectCalendar({ ...base, payments: [{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 100, currency: 'MXN' }, occurredAt: '2026-09-01T12:00:00.000Z', recordedAt: '2026-09-01T12:00:00.000Z', source: 'customer_payment', status: 'received' }] })).toEqual([expect.objectContaining({ id: 'customer_payment:component-1', balanceStatus: 'currency_mismatch' })]);
  });
});
