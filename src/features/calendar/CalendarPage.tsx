import { useMemo, useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Client, Commission, DeletedRecordReference, Payment, Service, ServiceProvider, Task, Trip } from '../../domain/types';
import { resolveRecordReference } from '../../domain/recordReference';
import { CalendarMonth } from './CalendarMonth';
import { CalendarSidePanel, type CalendarDetail } from './CalendarSidePanel';
import { CalendarWeek } from './CalendarWeek';
import { PlanningAgenda } from './PlanningAgenda';
import { addDays, addMonths, compactDate, dateRangeLabel, monthLabel } from './calendarDates';
import { projectCalendar, type CalendarProjection } from './calendarProjection';
import { FilterBar } from '../../design/components/FilterBar';
import { ContextHelp } from '../../design/components/ContextHelp';
import { formatOperationalNumber } from '../../domain/operationalDate';

type CalendarView = 'month' | 'week' | 'agenda';
type CalendarKindFilter = CalendarProjection['kind'];
type CalendarPageProps = Readonly<{
  clients: readonly Client[]; commissions: readonly Commission[]; payments?: readonly Payment[]; tasks: readonly Task[]; trips: readonly Trip[]; services: readonly Service[]; serviceProviders: readonly ServiceProvider[]; deletedReferences?: readonly DeletedRecordReference[]; today: string;
  onOpenTask: (id: string) => void; onOpenTrip: (id: string) => void; onOpenClient: (id: string) => void; onOpenCommission: (id: string) => void;
}>;

export function CalendarPage({ clients, commissions, payments = [], tasks, trips, services, serviceProviders, deletedReferences = [], today, onOpenTask, onOpenTrip, onOpenClient, onOpenCommission }: CalendarPageProps) {
  const locale = useLocale();
  const [view, setView] = useState<CalendarView>('month');
  const [reference, setReference] = useState(today.slice(0, 8) + '01');
  const [selected, setSelected] = useState<CalendarProjection>();
  const [visibleKinds, setVisibleKinds] = useState<readonly CalendarKindFilter[]>(['trip', 'task', 'customer_payment', 'commission']);
  const projections = useMemo(() => projectCalendar({ commissions, payments, serviceProviders, services, tasks, trips }), [commissions, payments, serviceProviders, services, tasks, trips]);
  const filteredProjections = useMemo(() => projections.filter((projection) => visibleKinds.includes(projection.kind)), [projections, visibleKinds]);
  const tripById = useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const componentById = useMemo(() => new Map(serviceProviders.map((component) => [component.id, component])), [serviceProviders]);
  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const commissionById = useMemo(() => new Map(commissions.map((commission) => [commission.id, commission])), [commissions]);
  const detailFor = (projection: CalendarProjection): CalendarDetail => {
    const trip = projection.target.type === 'trip_workspace' ? tripById.get(projection.target.id) : projection.kind === 'commission' ? tripById.get(commissionById.get(projection.target.id)?.tripId ?? '') : taskById.get(projection.target.id)?.tripId ? tripById.get(taskById.get(projection.target.id)?.tripId ?? '') : undefined;
    const client = trip ? resolveRecordReference(clients, deletedReferences, 'client', trip.clientId) : undefined;
    const clientName = client?.state === 'live'
      ? client.record.name
      : client?.state === 'deleted'
        ? t('deletedRecordReference', locale, { record: client.reference.displayLabel })
        : t('clientRecord', locale);
    const clientId = client?.state === 'live' ? client.record.id : undefined;
    const historicalClientContext = client?.state === 'deleted'
      ? ` · ${clientName}`
      : '';
    if (projection.kind === 'trip') return { projection, title: t('tripOf', locale, { client: clientName }), description: t('effectiveInterval', locale, { dates: dateRangeLabel(projection.startOn, projection.endOn, locale) }), tripId: trip?.id, clientId };
    if (projection.kind === 'task') return { projection, title: taskById.get(projection.target.id)?.title ?? t('task', locale), description: `${t('dueOn', locale, { date: compactDate(projection.startOn, locale) })}${historicalClientContext}`, tripId: trip?.id, clientId };
    if (projection.kind === 'customer_payment') {
      const component = componentById.get(projection.id.replace('customer_payment:', ''));
      const service = component ? serviceById.get(component.serviceId) : undefined;
      const balance = projection.balance ? t('pendingBalance', locale, { amount: formatOperationalNumber(projection.balance.amount), currency: projection.balance.currency }) : projection.balanceStatus === 'currency_mismatch' ? t('calendarBalanceCurrencyMismatch', locale) : t('pendingBalanceUnknown', locale);
      return { projection, title: `${t('customerBalance', locale)}${service ? ` · ${service.name}` : ''}`, description: `${t('dueDate', locale, { date: compactDate(projection.startOn, locale) })} · ${balance}${historicalClientContext}`, tripId: trip?.id, clientId };
    }
    return { projection, title: t('expectedCommission', locale), description: `${t('expectedDateDescription', locale, { date: compactDate(projection.startOn, locale) })}${historicalClientContext}`, tripId: trip?.id, clientId };
  };
  const labelFor = (projection: CalendarProjection): string => {
    const detail = detailFor(projection);
    return projection.kind === 'trip' ? `${detail.title}: ${dateRangeLabel(projection.startOn, projection.endOn, locale)}` : detail.title;
  };
  const weekEnd = addDays(reference, 6);
  const previous = () => setReference((current) => view === 'month' ? addMonths(current, -1) : addDays(current, -7));
  const next = () => setReference((current) => view === 'month' ? addMonths(current, 1) : addDays(current, 7));
  const heading = view === 'month' ? monthLabel(reference, locale) : view === 'week' ? t('weekOf', locale, { start: compactDate(reference, locale), end: compactDate(weekEnd, locale) }) : t('planningAgenda', locale);
  const filters: readonly Readonly<{ kind: CalendarKindFilter; label: string }>[] = [{ kind: 'trip', label: t('trip', locale) }, { kind: 'task', label: t('task', locale) }, { kind: 'customer_payment', label: t('calendarCustomerPaymentDue', locale) }, { kind: 'commission', label: t('commission', locale) }];
  return <div className={selected ? 'calendar-layout' : ''}><section className="calendar-page"><div className="calendar-toolbar"><div aria-label={t('calendarViews', locale)} className="calendar-view-toggle"><button aria-pressed={view === 'month'} onClick={() => setView('month')} type="button">{t('monthView', locale)}</button><button aria-pressed={view === 'week'} onClick={() => setView('week')} type="button">{t('weekView', locale)}</button><button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')} type="button">{t('planningAgenda', locale)}</button></div>{view !== 'agenda' && <div className="calendar-navigation"><button aria-label={t('previousPeriod', locale)} className="secondary-button" onClick={previous} type="button">{t('previous', locale)}</button><button aria-label={t('nextPeriod', locale)} className="secondary-button" onClick={next} type="button">{t('next', locale)}</button></div>}</div><FilterBar label={t('calendarFilters', locale)} onClear={() => setVisibleKinds(filters.map((filter) => filter.kind))}><div className="filter-chips">{filters.map((filter) => <div className="filter-chip-with-help" key={filter.kind}><button aria-pressed={visibleKinds.includes(filter.kind)} className="filter-chip" onClick={() => setVisibleKinds((current) => current.includes(filter.kind) ? current.filter((kind) => kind !== filter.kind) : [...current, filter.kind])} type="button">{filter.label}</button>{filter.kind === 'customer_payment' && <ContextHelp label={t('helpCustomerBalanceDueLabel', locale)}>{t('helpCustomerBalanceDue', locale)}</ContextHelp>}</div>)}</div></FilterBar><h2 className="calendar-heading">{heading}</h2>{view === 'month' ? <CalendarMonth labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} reference={reference} /> : view === 'week' ? <CalendarWeek labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} reference={reference} /> : <PlanningAgenda labelFor={labelFor} locale={locale} onSelect={setSelected} projections={filteredProjections} />}</section>{selected && <CalendarSidePanel detail={detailFor(selected)} onClose={() => setSelected(undefined)} onOpenClient={onOpenClient} onOpenCommission={onOpenCommission} onOpenTask={onOpenTask} onOpenTrip={onOpenTrip} />}</div>;
}
