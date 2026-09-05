import type { CalendarProjection } from './calendarProjection';
import { t, type Locale } from '../../app/i18n';
import { monthDays, projectionsForDay } from './calendarDates';

type CalendarMonthProps = Readonly<{
  reference: string;
  projections: readonly CalendarProjection[];
  labelFor: (projection: CalendarProjection) => string;
  onSelect: (projection: CalendarProjection) => void;
  locale: Locale;
}>;

export function CalendarMonth({ reference, projections, labelFor, onSelect, locale }: CalendarMonthProps) {
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  return <div className="calendar-month" role="grid" aria-label={t('calendarMonth', locale)}>
    {weekdays.map((day) => <div className="calendar-weekday" key={day}>{t(day, locale)}</div>)}
    {monthDays(reference).map((day, index) => <div className="calendar-day" key={day ?? `blank-${index}`} role="gridcell">
      {day && <><span className="calendar-day-number">{Number(day.slice(-2))}</span><div className="calendar-events">{projectionsForDay(projections, day).map((projection) => <button className={`calendar-event calendar-event-${projection.kind}`} key={`${projection.id}:${day}`} onClick={() => onSelect(projection)} type="button">{labelFor(projection)}</button>)}</div></>}
    </div>)}
  </div>;
}
