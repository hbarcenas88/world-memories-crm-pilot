import { describe, expect, it } from 'vitest';
import { buildWorkspaceNotifications } from '../../src/features/notifications/notificationModel';

describe('buildWorkspaceNotifications', () => {
  it('keeps overdue task alerts until the underlying task is resolved', () => {
    const overdueTask = { id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open' as const, createdAt: '2026-08-20T00:00:00.000Z' };

    expect(buildWorkspaceNotifications({ commissions: [], tasks: [overdueTask], today: '2026-08-26' })).toMatchObject([{ id: 'task:task-1', kind: 'task', targetId: 'task-1', subject: 'Confirmar itinerario' }]);
    expect(buildWorkspaceNotifications({ commissions: [], tasks: [{ ...overdueTask, status: 'completed' }], today: '2026-08-26' })).toEqual([]);
    expect(buildWorkspaceNotifications({ commissions: [], tasks: [{ ...overdueTask, dueOn: '2026-08-29' }], today: '2026-08-26' })).toEqual([]);
  });

  it('keeps due commissions visible until their payment is registered', () => {
    const commission = { id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' as const }, dueOn: '2026-08-25', status: 'expected' as const, createdAt: '2026-08-20T00:00:00.000Z' };

    expect(buildWorkspaceNotifications({ commissions: [commission], tasks: [], today: '2026-08-26' })).toMatchObject([{ id: 'commission:commission-1', kind: 'commission', targetId: 'commission-1' }]);
    expect(buildWorkspaceNotifications({ commissions: [{ ...commission, status: 'paid' }], tasks: [], today: '2026-08-26' })).toEqual([]);
  });

  it('keeps an active customer-payment alert visible without treating a dismissed panel as resolution', () => {
    const service = { id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active' as const, createdAt: '2026-08-20T00:00:00.000Z' };
    const component = { id: 'component-1', serviceId: service.id, providerId: 'provider-1', currency: 'USD' as const, commissionStatus: 'without_commission' as const, customerBalanceDueOn: '2026-08-25', createdAt: '2026-08-20T00:00:00.000Z' };

    expect(buildWorkspaceNotifications({ commissions: [], serviceProviders: [component], services: [service], tasks: [], today: '2026-08-26' })).toMatchObject([{ id: 'payment:component-1', kind: 'payment', targetId: 'component-1', subject: 'overdue' }]);
    expect(buildWorkspaceNotifications({ commissions: [], serviceProviders: [{ ...component, customerBalanceDueOn: '2026-09-03' }], services: [service], tasks: [], today: '2026-08-26' })).toEqual([]);
  });

  it('also alerts seven days before a customer balance becomes due', () => {
    const service = { id: 'service-next', tripId: 'trip-1', name: 'Hotel', status: 'active' as const, createdAt: '2026-08-20T00:00:00.000Z' };
    const component = { id: 'component-next', serviceId: service.id, providerId: 'provider-1', currency: 'USD' as const, commissionStatus: 'without_commission' as const, customerBalanceDueOn: '2026-09-01', createdAt: '2026-08-20T00:00:00.000Z' };

    expect(buildWorkspaceNotifications({ commissions: [], serviceProviders: [component], services: [service], tasks: [], today: '2026-08-26' })).toMatchObject([{ id: 'payment:component-next', kind: 'payment', subject: 'upcoming' }]);
  });
});
