import { t, useLocale } from '../../app/i18n';
import type { BackupDownload, Commission, Lead, Service, ServiceProvider, Task, Trip } from '../../domain/types';
import { formatOperationalDate } from '../../domain/operationalDate';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { buildBackupReminder } from '../data/backupReminderModel';
import { buildDashboardSnapshot } from './dashboardModel';

type DashboardProps = Readonly<{ today: string; leads: readonly Lead[]; trips: readonly Trip[]; tasks: readonly Task[]; commissions: readonly Commission[]; services?: readonly Service[]; serviceProviders?: readonly ServiceProvider[]; backupDownloads?: readonly BackupDownload[]; onOpenTrip?: (tripId: string) => void; onOpenTask?: (taskId: string) => void; onOpenCommission?: (commissionId: string) => void; onCompleteTask?: (taskId: string) => void; onRescheduleTask?: (taskId: string, dueOn: string) => void }>;

export function Dashboard({ today, leads, trips, tasks, commissions, services = [], serviceProviders = [], backupDownloads = [], onOpenTrip, onOpenTask, onOpenCommission, onCompleteTask, onRescheduleTask }: DashboardProps) {
  const locale = useLocale();
  const snapshot = buildDashboardSnapshot({ today, leads, trips, tasks, commissions, services, serviceProviders });
  const backupReminder = buildBackupReminder(backupDownloads, `${today}T12:00:00.000Z`);
  const renderTrips = (items: readonly Trip[]) => items.length === 0
    ? <p className="muted-copy">{t('noTripsDashboard', locale)}</p>
    : <ul>{items.map((trip) => <li key={trip.id}><strong>{t('trip', locale)}</strong><span>{trip.effectiveStartOn ? formatOperationalDate(trip.effectiveStartOn) : t('datesToDefine', locale)} — {trip.effectiveEndOn ? formatOperationalDate(trip.effectiveEndOn) : t('datesToDefine', locale)}</span>{onOpenTrip && <button className="text-button" onClick={() => onOpenTrip(trip.id)} type="button">{t('openTrip', locale)}</button>}</li>)}</ul>;

  return <section aria-label={t('operationalDashboard', locale)} className="dashboard-grid">
    <article className="dashboard-card"><h2>{t('activeLeadsDashboard', locale)}</h2><strong>{snapshot.activeLeads.length}</strong></article>
    <article className="dashboard-card"><h2>{t('quotesToSend', locale)}</h2><strong>{snapshot.quotePreparing}</strong></article>
    <article className="dashboard-card"><h2>{t('followUpsDashboard', locale)}</h2><strong>{snapshot.followUpLeads.length}</strong></article>
    <article className="dashboard-card"><h2>{t('overdueTasksDashboard', locale)}</h2><strong>{snapshot.overdueTasks.length}</strong></article>
    <article className="dashboard-card"><h2>{t('overdueCommissionsDashboard', locale)}</h2><strong>{snapshot.overdueCommissions.length}</strong></article>
    <article className="dashboard-card"><h2>{t('customerBalancesDueDashboard', locale)}</h2><strong>{snapshot.dueCustomerBalances.length}</strong></article>
    <section className="dashboard-card dashboard-wide"><h2>{t('expectedCommissionsDashboard', locale)}</h2><p>{snapshot.expectedCommissions.USD} USD</p><p>{snapshot.expectedCommissions.MXN} MXN</p></section>
    <section className="dashboard-card dashboard-wide"><h2>{t('receivedCommissionsDashboard', locale)}</h2><strong>{snapshot.paidCommissionsThisMonth.length}</strong><p>{snapshot.receivedCommissionsThisMonth.USD} USD</p><p>{snapshot.receivedCommissionsThisMonth.MXN} MXN</p></section>
    {backupReminder.eligible && <section className="dashboard-queue dashboard-wide"><h2>{t('backupPending', locale)}</h2><p>{t('backupReminderThreeDays', locale)}</p></section>}
    <section className="dashboard-queue"><h2>{t('travellersInProgress', locale)}</h2>{renderTrips(snapshot.travelersInProgress)}</section>
    <section className="dashboard-queue"><h2>{t('upcomingTripsDashboard', locale)}</h2>{renderTrips(snapshot.upcomingTrips)}</section>
    <section className="dashboard-queue dashboard-queue-wide"><h2>{t('priorityAttention', locale)}</h2>{snapshot.overdueTasks.length === 0 ? <p className="muted-copy">{t('noOverdueTasks', locale)}</p> : <ul>{snapshot.overdueTasks.map((task) => <li key={task.id}><strong>{task.title}</strong><span>{t('overdueOn', locale, { date: task.dueOn ? formatOperationalDate(task.dueOn) : t('undefinedValue', locale) })}</span><div className="task-actions">{onOpenTask && <button className="text-button" onClick={() => onOpenTask(task.id)} type="button">{t('openTask', locale)}</button>}{onRescheduleTask && <OperationalDateField aria-label={t('newDateFor', locale, { task: task.title })} onChange={(dueOn) => { if (dueOn) onRescheduleTask(task.id, dueOn); }} value={task.dueOn} />}{onCompleteTask && <button className="secondary-button" onClick={() => onCompleteTask(task.id)} type="button">{t('complete', locale)} {task.title}</button>}</div></li>)}</ul>}</section>
    <section className="dashboard-queue dashboard-queue-wide"><h2>{t('overdueCommissionQueue', locale)}</h2>{snapshot.overdueCommissions.length === 0 ? <p className="muted-copy">{t('undefinedValue', locale)}</p> : <ul>{snapshot.overdueCommissions.map((commission) => <li key={commission.id}><strong>{commission.expected.amount} {commission.expected.currency}</strong><span>{commission.dueOn ? formatOperationalDate(commission.dueOn) : t('undated', locale)}</span>{onOpenCommission && <button className="text-button" onClick={() => onOpenCommission(commission.id)} type="button">{t('openCommission', locale)}</button>}</li>)}</ul>}</section>
  </section>;
}
