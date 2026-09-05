import { t, useLocale } from '../../app/i18n';
import type { CalendarProjection } from './calendarProjection';

export type CalendarDetail = Readonly<{ projection: CalendarProjection; title: string; description: string; tripId?: string; clientId?: string }>;

export function CalendarSidePanel({ detail, onClose, onOpenClient, onOpenCommission, onOpenTask, onOpenTrip }: Readonly<{ detail: CalendarDetail; onClose: () => void; onOpenClient: (id: string) => void; onOpenCommission: (id: string) => void; onOpenTask: (id: string) => void; onOpenTrip: (id: string) => void }>) {
  const { projection } = detail;
  const locale = useLocale();
  const kind = projection.kind === 'trip' ? t('trip', locale) : projection.kind === 'task' ? t('task', locale) : projection.kind === 'customer_payment' ? t('customerBalance', locale) : t('commission', locale);
  return <aside aria-label={t('calendarDetails', locale)} className="calendar-side-panel" role="complementary"><div className="detail-header"><div><p className="detail-status">{kind}</p><h2>{detail.title}</h2></div><button aria-label={t('closeCalendarDetails', locale)} className="text-button" onClick={onClose} type="button">{t('close', locale)}</button></div><p className="muted-copy">{detail.description}</p><div className="calendar-panel-actions">{projection.kind === 'task' && <button className="primary-button" onClick={() => onOpenTask(projection.target.id)} type="button">{t('openTask', locale)}</button>}{projection.kind === 'commission' && <button className="primary-button" onClick={() => onOpenCommission(projection.target.id)} type="button">{t('openCommission', locale)}</button>}{detail.tripId && <button className="secondary-button" onClick={() => onOpenTrip(detail.tripId!)} type="button">{t('openTrip', locale)}</button>}{detail.clientId && <button className="secondary-button" onClick={() => onOpenClient(detail.clientId!)} type="button">{t('openClient', locale)}</button>}</div></aside>;
}
