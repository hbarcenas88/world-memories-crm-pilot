import { useMemo, useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Client, Commission, Service, ServiceProvider, Task, Trip } from '../../domain/types';
import { CalendarMonth } from './CalendarMonth';
import { CalendarSidePanel, type CalendarDetail } from './CalendarSidePanel';
import { CalendarWeek } from './CalendarWeek';
import { PlanningAgenda } from './PlanningAgenda';
import { addDays, addMonths, compactDate, dateRangeLabel, monthLabel } from './calendarDates';
import { projectCalendar, type CalendarProjection } from './calendarProjection';

type CalendarView = 'month' | 'week' | 'agenda';
type CalendarKindFilter = CalendarProjection['kind'];
type CalendarPageProps = Readonly<{
  clients: readonly Client[]; commissions: readonly Commission[]; tasks: readonly Task[]; trips: readonly Trip[]; services: readonly Service[]; serviceProviders: readonly ServiceProvider[]; today: string;
  onOpenTask: (id: string) => void; onOpenTrip: (id: string) => void; onOpenClient: (id: string) => void; onOpenCommission: (id: string) => void;
}>;

export function CalendarPage({ clients, commissions, tasks, trips, services, serviceProviders, today, onOpenTask, onOpenTrip, onOpenClient, onOpenCommission }: CalendarPageProps) {
  const locale = useLocale();
  const [view, setView] = useState<CalendarView>('month');
  const [reference, setReference] = useState(today.slice(0, 8) + '01');
  const [selected, setSelected] = useState<CalendarProjection>();
  const [visibleKinds, setVisibleKinds] = useState<readonly CalendarKindFilter[]>(['trip', 'task', 'customer_payment', 'commission']);
  const projections = useMemo(() => projectCalendar({ commissions, serviceProviders, services, tasks, trips }), [commissions, serviceProviders, services, tasks, trips]);
  const filteredProjections = useMemo(() => projections.filter((projection) => visibleKinds.includes(projection.kind)), [projections, visibleKinds]);
  const tripById = useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const componentById = useMemo(() => new Map(serviceProviders.map((component) => [component.id, component])), [serviceProviders]);
  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const commissionById = useMemo(() => new Map(commissions.map((commission) => [commission.id, commission])), [commissions]);
  const detailFor = (projection: CalendarProjection): CalendarDetail => {
    const trip = projection.target.type === 'trip_workspace' ? tripById.get(projection.target.id) : projection.kind === 'commission' ? tripById.get(commissionById.get(projection.target.id)?.tripId ?? '') : taskById.get(projection.target.id)?.tripId ? tripById.get(taskById.get(projection.target.id)?.tripId ?? '') : undefined;
    const client = trip ? clientById.get(trip.clientId) : undefined;
    if (projection.kind === 'trip') return { projection, title: t('tripOf', locale, { client: client?.name ?? t('clientRecord', locale) }), description: t('effectiveInterval', locale, { dates: dateRangeLabel(projection.startOn, projection.endOn, locale) }), tripId: trip?.id, clientId: client?.id };
    if (projection.kind === 'task') return { projection, title: taskById.get(projection.target.id)?.title ?? t('task', locale), description: t('dueOn', locale, { date: compactDate(projection.startOn, locale) }), tripId: trip?.id, clientId: client?.id };
    if (projection.kind === 'customer_payment') {
      const component = componentById.get(projection.id.replace('customer_payment:', ''));
      const service = component ? serviceById.get(component.serviceId) : undefined;
      return { projection, title: `${t('customerBalance', locale)}${service ? ` · ${service.name}` : ''}`, description: t('dueDate', locale, { date: compactDate(projection.startOn, locale) }), tripId: trip?.id, clientId: client?.id };
    }
    return { projection, title: t('expectedCommission', locale), description: t('expectedDateDescription', locale, { date: compactDate(projection.startOn, locale) }), tripId: trip?.id, clientId: client?.id };
  };
  const labelFor = (projection: CalendarProjection): string => {
    const detail = detailFor(projection);
    return projection.kind === 'trip' ? `${detail.title}: ${dateRangeLabel(projection.startOn, projection.endOn, locale)}` : detail.title;
  };
  const weekEnd = addDays(reference, 6);
  const previous = () => setReference((current) => view === 'month' ? addMonths(current, -1) : addDays(current, -7));
  const next = () => setReference((current) => view === 'month' ? addMonths(current, 1) : addDays(current, 7));
  const heading = view === 'month' ? monthLabel(reference, locale) : view === 'week' ? t('weekOf', locale, { start: compactDate(reference, locale), end: compactDate(weekEnd, locale) }) : t('planningAgenda', locale);
  const filters: readonly Readonly<{ kind: CalendarKindFilter; label: string }>[] = [{ kind: 'trip', label: t('trip', locale) }, { kind: 'task', label: t('task', locale) }, { kind: 'customer_payment', label: t('customerBalance', locale) }, { kind: 'commission', label: t('commission', locale) }];
  return <div className={selected ? 'calendar-layout' : ''}><section className="calendar-page"><div className="calendar-toolbar"><div aria-label={t('calendarViews', locale)} className="calendar-view-toggle"><button aria-pressed={view === 'month'} onClick={() => setView('month')} type="button">{t('monthView', locale)}</button><button aria-pressed={view === 'week'} onClick={() => setView('week')} type="button">{t('weekView', locale)}</button><button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')} type="button">{t('planningAgenda', locale)}</button></div>{view !== 'agenda' && <div className="calendar-navigation"><button aria-label={t('previousPeriod', locale)} className="secondary-button" onClick={previous} type="button">{t('previous', locale)}</button><button aria-label={t('nextPeriod', locale)} className="secondary-button" onClick={next} type="button">{t('next', locale)}</button></div>}</div><fieldset className="calendar-filters"><legend>{t('calendarFilters', locale)}</legend>{filters.map((filter) => <label key={filter.kind}><input checked={visibleKinds.includes(filter.kind)} onChange={(event) => setVisibleKinds((current) => event.target.checked ? [...current, filter.kind] : current.filter((kind) => kind !== filter.kind))} type="checkbox" />{filter.label}</label>)}</fieldset><h2 className="calendar-heading">{heading}</h2>{view === 'month' ? <CalendarMonth labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} reference={reference} /> : view === 'week' ? <CalendarWeek labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} reference={reference} /> : <PlanningAgenda labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} />}</section>{selected && <CalendarSidePanel detail={detailFor(selected)} onClose={() => setSelected(undefined)} onOpenClient={onOpenClient} onOpenCommission={onOpenCommission} onOpenTask={onOpenTask} onOpenTrip={onOpenTrip} />}</div>;
}
