import type { Commission, Service, ServiceProvider, Task, Trip } from '../../domain/types';

export type CalendarProjection = Readonly<{
  id: string;
  kind: 'trip' | 'task' | 'customer_payment' | 'commission';
  startOn: string;
  endOn?: string;
  target: Readonly<{ type: 'trip_workspace' | 'task_context' | 'commission_section'; id: string }>;
}>;

export type CalendarWorkspace = Readonly<{
  trips: readonly Trip[];
  tasks: readonly Task[];
  services: readonly Service[];
  serviceProviders: readonly ServiceProvider[];
  commissions: readonly Commission[];
}>;

export function projectCalendar(workspace: CalendarWorkspace): readonly CalendarProjection[] {
  const tripIdByServiceId = new Map(workspace.services.filter((service) => service.status === 'active').map((service) => [service.id, service.tripId]));
  const projections: CalendarProjection[] = [
    ...workspace.trips.flatMap((trip): readonly CalendarProjection[] => trip.effectiveStartOn && trip.effectiveEndOn ? [{
      id: `trip:${trip.id}`,
      kind: 'trip',
      startOn: trip.effectiveStartOn,
      endOn: trip.effectiveEndOn,
      target: { type: 'trip_workspace', id: trip.id },
    }] : []),
    ...workspace.tasks.flatMap((task): readonly CalendarProjection[] => task.status === 'open' && task.dueOn ? [{
      id: `task:${task.id}`,
      kind: 'task',
      startOn: task.dueOn,
      target: { type: 'task_context', id: task.id },
    }] : []),
    ...workspace.serviceProviders.flatMap((component): readonly CalendarProjection[] => {
      const tripId = tripIdByServiceId.get(component.serviceId);
      return component.customerBalanceDueOn && tripId ? [{
        id: `customer_payment:${component.id}`,
        kind: 'customer_payment',
        startOn: component.customerBalanceDueOn,
        target: { type: 'trip_workspace', id: tripId },
      }] : [];
    }),
    ...workspace.commissions.flatMap((commission): readonly CalendarProjection[] => commission.status === 'expected' && commission.dueOn ? [{
      id: `commission:${commission.id}`,
      kind: 'commission',
      startOn: commission.dueOn,
      target: { type: 'commission_section', id: commission.id },
    }] : []),
  ];
  return projections.sort((left, right) => left.startOn.localeCompare(right.startOn) || left.id.localeCompare(right.id));
}
