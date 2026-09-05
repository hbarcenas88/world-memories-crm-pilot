import type { BackupDownload, Commission, Service, ServiceProvider, Task } from '../../domain/types';
import { buildBackupReminder } from '../data/backupReminderModel';

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export type WorkspaceNotification = Readonly<{
  id: string;
  kind: 'task' | 'commission' | 'payment' | 'backup';
  targetId: string;
  subject?: string;
}>;

export function buildWorkspaceNotifications({ backupDownloads = [], commissions, serviceProviders = [], services = [], tasks, today }: Readonly<{ backupDownloads?: readonly BackupDownload[]; commissions: readonly Commission[]; serviceProviders?: readonly ServiceProvider[]; services?: readonly Service[]; tasks: readonly Task[]; today: string }>): readonly WorkspaceNotification[] {
  const overdueTasks = tasks.filter((task) => task.status === 'open' && task.dueOn !== undefined && task.dueOn < today).map((task) => ({
    id: `task:${task.id}`, kind: 'task' as const, targetId: task.id, subject: task.title,
  }));
  const overdueCommissions = commissions.filter((commission) => commission.status === 'expected' && commission.dueOn !== undefined && commission.dueOn < today).map((commission) => ({
    id: `commission:${commission.id}`, kind: 'commission' as const, targetId: commission.id, subject: `${commission.expected.amount} ${commission.expected.currency}`,
  }));
  const activeServiceIds = new Set(services.filter((service) => service.status === 'active').map((service) => service.id));
  const paymentAlerts = serviceProviders.filter((component) => component.customerBalanceDueOn !== undefined && activeServiceIds.has(component.serviceId) && component.customerBalanceDueOn <= addDays(today, 7)).map((component) => ({
    id: `payment:${component.id}`, kind: 'payment' as const, targetId: component.id, subject: component.customerBalanceDueOn! < today ? 'overdue' : component.customerBalanceDueOn === today ? 'due_today' : 'upcoming',
  }));
  const reminder = buildBackupReminder(backupDownloads, `${today}T12:00:00.000Z`);
  const backup = reminder.eligible ? [{ id: 'backup:reminder', kind: 'backup' as const, targetId: reminder.latest?.id ?? 'backup' }] : [];
  return [...overdueTasks, ...overdueCommissions, ...paymentAlerts, ...backup];
}
