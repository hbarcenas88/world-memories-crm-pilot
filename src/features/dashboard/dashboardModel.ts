import type { Commission, Lead, Service, ServiceProvider, Task, Trip } from '../../domain/types';

type DashboardWorkspace = Readonly<{ today: string; leads: readonly Lead[]; trips: readonly Trip[]; tasks: readonly Task[]; commissions: readonly Commission[]; services?: readonly Service[]; serviceProviders?: readonly ServiceProvider[] }>;

function totals(items: readonly Commission[]): Readonly<Record<'USD' | 'MXN', number>> {
  return items.reduce<Record<'USD' | 'MXN', number>>((current, item) => ({ ...current, [item.expected.currency]: current[item.expected.currency] + item.expected.amount }), { USD: 0, MXN: 0 });
}

export function buildDashboardSnapshot(workspace: DashboardWorkspace) {
  const openTasks = workspace.tasks.filter((task) => task.status === 'open');
  const expected = workspace.commissions.filter((commission) => commission.status === 'expected');
  const activeServiceIds = new Set((workspace.services ?? []).filter((service) => service.status === 'active').map((service) => service.id));
  const [year, month] = workspace.today.split('-').map(Number);
  const firstOfCurrentMonth = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-01`;
  const firstOfMonthAfterNext = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
  const paidCommissionsThisMonth = workspace.commissions.filter((commission) => commission.status === 'paid' && commission.paidOn && commission.paidOn >= firstOfCurrentMonth && commission.paidOn < firstOfMonthAfterNext);
  return {
    activeLeads: workspace.leads.filter((lead) => lead.status !== 'sold' && lead.status !== 'cancelled'),
    travelersInProgress: workspace.trips.filter((trip) => trip.effectiveStartOn && trip.effectiveEndOn && trip.effectiveStartOn <= workspace.today && trip.effectiveEndOn >= workspace.today),
    upcomingTrips: workspace.trips.filter((trip) => trip.effectiveStartOn && trip.effectiveStartOn >= firstOfCurrentMonth && trip.effectiveStartOn < firstOfMonthAfterNext),
    quotePreparing: workspace.leads.filter((lead) => lead.status === 'quote_preparing').length,
    followUpLeads: workspace.leads.filter((lead) => lead.status === 'quote_sent' || lead.status === 'follow_up'),
    overdueTasks: openTasks.filter((task) => task.dueOn && task.dueOn < workspace.today),
    overdueCommissions: expected.filter((commission) => commission.dueOn && commission.dueOn < workspace.today),
    dueCustomerBalances: (workspace.serviceProviders ?? []).filter((component) => activeServiceIds.has(component.serviceId) && component.customerBalanceDueOn && component.customerBalanceDueOn <= workspace.today),
    expectedCommissions: totals(expected),
    paidCommissionsThisMonth,
    receivedCommissionsThisMonth: paidCommissionsThisMonth.reduce<Record<'USD' | 'MXN', number>>((current, commission) => {
      if (!commission.received) return current;
      return { ...current, [commission.received.currency]: current[commission.received.currency] + commission.received.amount };
    }, { USD: 0, MXN: 0 }),
  };
}
