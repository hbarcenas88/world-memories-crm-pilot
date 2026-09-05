import { Bell } from 'lucide-react';
import { useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { WorkspaceNotification } from './notificationModel';

type NotificationCenterProps = Readonly<{
  notifications: readonly WorkspaceNotification[];
  onOpen: (notification: WorkspaceNotification) => void;
}>;

function notificationLabel(notification: WorkspaceNotification, locale: ReturnType<typeof useLocale>): string {
  if (notification.kind === 'task') return t('overdueTaskNotification', locale, { subject: notification.subject ?? t('task', locale) });
  if (notification.kind === 'commission') return t('overdueCommissionNotification', locale, { subject: notification.subject ?? t('commission', locale) });
  if (notification.kind === 'payment') return t(notification.subject === 'upcoming' ? 'customerPaymentUpcomingNotification' : notification.subject === 'due_today' ? 'customerPaymentDueNotification' : 'customerPaymentOverdueNotification', locale);
  return t('backupReminderThreeDays', locale);
}

export function NotificationCenter({ notifications, onOpen }: NotificationCenterProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const label = t('notificationsWithCount', locale, { count: notifications.length });

  return <section className="notification-center">
    <button aria-expanded={isOpen} className="icon-button notification-trigger" onClick={() => setIsOpen((current) => !current)} type="button"><Bell aria-hidden="true" size={21} /><span className="sr-only">{label}</span>{notifications.length > 0 && <span aria-hidden="true" className="notification-count">{notifications.length}</span>}</button>
    {isOpen && <section aria-label={t('notifications', locale)} className="notification-panel"><h2>{t('activeAlerts', locale)}</h2>{notifications.length === 0 ? <p className="muted-copy">{t('noPendingAlerts', locale)}</p> : <ul>{notifications.map((notification) => <li key={notification.id}><button onClick={() => onOpen(notification)} type="button">{notificationLabel(notification, locale)}</button></li>)}</ul>}</section>}
  </section>;
}
