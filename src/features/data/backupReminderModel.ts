import type { BackupDownload } from '../../domain/types';

export type BackupReminder = Readonly<{ eligible: boolean; latest?: BackupDownload; reason?: 'threeDaysSinceJsonBackup' }>;

function addCalendarDays(value: string, days: number): string { const date = new Date(value); date.setUTCDate(date.getUTCDate() + days); return date.toISOString(); }

export function buildBackupReminder(downloads: readonly BackupDownload[], now: string): BackupReminder {
  const latest = downloads.filter((download) => download.kind === 'full_json').sort((left, right) => right.downloadedAt.localeCompare(left.downloadedAt))[0];
  if (!latest) return { eligible: false };
  if (latest.reminderDismissedUntil && latest.reminderDismissedUntil > now) return { eligible: false, latest };
  if (addCalendarDays(latest.downloadedAt, 3) <= now) return { eligible: true, latest, reason: 'threeDaysSinceJsonBackup' };
  return { eligible: false, latest };
}
