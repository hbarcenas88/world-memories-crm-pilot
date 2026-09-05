import type { CalendarProjection } from './calendarProjection';
import { t, type Locale } from '../../app/i18n';
import { addDays, compactDate, projectionsForDay } from './calendarDates';

type CalendarWeekProps = Readonly<{
  reference: string;
  projections: readonly CalendarProjection[];
  labelFor: (projection: CalendarProjection) => string;
  onSelect: (projection: CalendarProjection) => void;
  locale: Locale;
}>;

export function CalendarWeek({ reference, projections, labelFor, onSelect, locale }: CalendarWeekProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(reference, index));
  return <div className="calendar-week" aria-label={t('calendarWeek', locale)}>
    {days.map((day) => <section key={day}><h3>{compactDate(day, locale)}</h3><div>{projectionsForDay(projections, day).map((projection) => <button className={`calendar-event calendar-event-${projection.kind}`} key={`${projection.id}:${day}`} onClick={() => onSelect(projection)} type="button">{labelFor(projection)}</button>)}</div></section>)}
  </div>;
}
