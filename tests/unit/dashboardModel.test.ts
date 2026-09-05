import { describe, expect, it } from 'vitest';
import { buildDashboardSnapshot } from '../../src/features/dashboard/dashboardModel';

describe('buildDashboardSnapshot', () => {
  it('projects current operational queues and keeps financial totals separated by currency', () => {
    const snapshot = buildDashboardSnapshot({
      today: '2026-08-26',
      leads: [{ id: 'lead-1', name: 'Familia', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'quote_preparing', createdAt: '2026-08-20T00:00:00.000Z' }],
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-08-25', effectiveEndOn: '2026-08-30' }],
      tasks: [{ id: 'task-1', title: 'Llamar', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }],
      commissions: [{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, dueOn: '2026-08-25', status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }, { id: 'commission-2', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'MXN' }, status: 'paid', received: { amount: 90, currency: 'MXN' }, paidOn: '2026-08-12', createdAt: '2026-08-20T00:00:00.000Z' }],
    });

    expect(snapshot.travelersInProgress).toHaveLength(1);
    expect(snapshot.quotePreparing).toBe(1);
    expect(snapshot.overdueTasks).toHaveLength(1);
    expect(snapshot.overdueCommissions).toHaveLength(1);
    expect(snapshot.expectedCommissions).toEqual({ USD: 80, MXN: 0 });
    expect(snapshot.paidCommissionsThisMonth).toEqual([expect.objectContaining({ id: 'commission-2' })]);
  });

  it('separates commissions received during the current month from expected commissions', () => {
    const snapshot = buildDashboardSnapshot({
      today: '2026-08-26',
      leads: [],
      trips: [],
      tasks: [],
      commissions: [
        { id: 'paid-now', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, received: { amount: 75, currency: 'USD' }, paidOn: '2026-08-20', status: 'paid', createdAt: '2026-08-20T00:00:00.000Z' },
        { id: 'paid-before', tripId: 'trip-2', providerId: 'provider-1', expected: { amount: 90, currency: 'MXN' }, received: { amount: 90, currency: 'MXN' }, paidOn: '2026-07-31', status: 'paid', createdAt: '2026-07-20T00:00:00.000Z' },
      ],
    });

    expect(snapshot.paidCommissionsThisMonth).toEqual([expect.objectContaining({ id: 'paid-now' })]);
    expect(snapshot.receivedCommissionsThisMonth).toEqual({ USD: 75, MXN: 0 });
  });

  it('keeps commercial follow-up and customer balances in their operational queues and limits upcoming trips to this and next month', () => {
    const snapshot = buildDashboardSnapshot({
      today: '2026-08-26',
      leads: [
        { id: 'lead-followup', name: 'Seguimiento', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'follow_up', createdAt: '2026-08-20T00:00:00.000Z' },
        { id: 'lead-closed', name: 'Cerrado', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'cancelled', createdAt: '2026-08-20T00:00:00.000Z' },
      ],
      trips: [
        { id: 'trip-next', leadId: 'lead-followup', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-05' },
        { id: 'trip-later', leadId: 'lead-followup', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-10-05' },
      ],
      tasks: [],
      commissions: [],
      services: [{ id: 'service-1', tripId: 'trip-next', name: 'Hotel', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
      serviceProviders: [{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'without_commission', customerBalanceDueOn: '2026-08-26', createdAt: '2026-08-20T00:00:00.000Z' }],
    });

    expect(snapshot.activeLeads).toHaveLength(1);
    expect(snapshot.followUpLeads).toHaveLength(1);
    expect(snapshot.dueCustomerBalances).toHaveLength(1);
    expect(snapshot.upcomingTrips.map((trip) => trip.id)).toEqual(['trip-next']);
  });
});
