import { customerBalance } from '../../domain/paymentDue';
import type { Commission, Money, Payment, Service, ServiceProvider, Task, Trip } from '../../domain/types';

export type CalendarProjection = Readonly<{
  id: string;
  kind: 'trip' | 'task' | 'customer_payment' | 'commission';
  startOn: string;
  endOn?: string;
  balance?: Money;
  balanceStatus?: 'known' | 'unknown_total' | 'currency_mismatch';
  target: Readonly<{ type: 'trip_workspace' | 'task_context' | 'commission_section'; id: string }>;
}>;

export type CalendarWorkspace = Readonly<{
  trips: readonly Trip[];
  tasks: readonly Task[];
  services: readonly Service[];
  serviceProviders: readonly ServiceProvider[];
  commissions: readonly Commission[];
  payments: readonly Payment[];
}>;

export function projectCalendar(workspace: CalendarWorkspace): readonly CalendarProjection[] {
  const tripIdByServiceId = new Map(workspace.services.filter((service) => service.status === 'active' && !service.archivedAt).map((service) => [service.id, service.tripId]));
  const projections: CalendarProjection[] = [
    ...workspace.trips.flatMap((trip): readonly CalendarProjection[] => trip.status === 'active' && !trip.archivedAt && trip.effectiveStartOn && trip.effectiveEndOn ? [{
      id: `trip:${trip.id}`,
      kind: 'trip',
      startOn: trip.effectiveStartOn,
      endOn: trip.effectiveEndOn,
      target: { type: 'trip_workspace', id: trip.id },
    }] : []),
    ...workspace.tasks.flatMap((task): readonly CalendarProjection[] => task.status === 'open' && !task.archivedAt && task.dueOn ? [{
      id: `task:${task.id}`,
      kind: 'task',
      startOn: task.dueOn,
      target: { type: 'task_context', id: task.id },
    }] : []),
    ...workspace.serviceProviders.flatMap((component): readonly CalendarProjection[] => {
      const tripId = tripIdByServiceId.get(component.serviceId);
      if (!component.customerBalanceDueOn || !tripId || component.cancelledAt) return [];
      const componentPayments = workspace.payments.filter((payment) => payment.status === 'received' && !payment.archivedAt && payment.serviceProviderId === component.id).map((payment) => payment.amount);
      if (component.saleAmount === undefined) return [{
        id: `customer_payment:${component.id}`,
        kind: 'customer_payment',
        startOn: component.customerBalanceDueOn,
        target: { type: 'trip_workspace', id: tripId },
        balanceStatus: 'unknown_total',
      }];
      try {
        const outstanding = customerBalance({ amount: component.saleAmount, currency: component.currency }, componentPayments);
        return outstanding > 0 ? [{
          id: `customer_payment:${component.id}`,
          kind: 'customer_payment',
          startOn: component.customerBalanceDueOn,
          target: { type: 'trip_workspace', id: tripId },
          balance: { amount: outstanding, currency: component.currency },
          balanceStatus: 'known',
        }] : [];
      } catch {
        return [{
          id: `customer_payment:${component.id}`,
          kind: 'customer_payment',
          startOn: component.customerBalanceDueOn,
          target: { type: 'trip_workspace', id: tripId },
          balanceStatus: 'currency_mismatch',
        }];
      }
    }),
    ...workspace.commissions.flatMap((commission): readonly CalendarProjection[] => commission.status === 'expected' && !commission.archivedAt && commission.dueOn ? [{
      id: `commission:${commission.id}`,
      kind: 'commission',
      startOn: commission.dueOn,
      target: { type: 'commission_section', id: commission.id },
    }] : []),
  ];
  return projections.sort((left, right) => left.startOn.localeCompare(right.startOn) || left.id.localeCompare(right.id));
}
