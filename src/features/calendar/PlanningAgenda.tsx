import type { CalendarProjection } from './calendarProjection';
import { t, type Locale } from '../../app/i18n';
import { dateRangeLabel } from './calendarDates';

export function PlanningAgenda({ projections, labelFor, onSelect, locale }: Readonly<{ projections: readonly CalendarProjection[]; labelFor: (projection: CalendarProjection) => string; onSelect: (projection: CalendarProjection) => void; locale: Locale }>) {
  return <section className="planning-agenda" aria-label={t('planningAgenda', locale)}>
    {projections.length === 0 ? <p className="muted-copy">{t('noScheduledMilestones', locale)}</p> : <ol>{projections.map((projection) => <li key={projection.id}><span>{dateRangeLabel(projection.startOn, projection.endOn, locale)}</span><button className={`calendar-event calendar-event-${projection.kind}`} onClick={() => onSelect(projection)} type="button">{labelFor(projection)}</button></li>)}</ol>}
  </section>;
}
