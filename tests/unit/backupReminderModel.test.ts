import { describe, expect, it } from 'vitest';
import { buildBackupReminder } from '../../src/features/data/backupReminderModel';

describe('buildBackupReminder', () => {
  it('reminds after three days, ignores Excel, and respects a one-day dismissal', () => {
    expect(buildBackupReminder([{ id: 'excel-1', kind: 'operational_excel', downloadedAt: '2026-08-20T12:00:00.000Z', schemaVersion: 1 }], '2026-08-27T12:00:00.000Z').eligible).toBe(false);
    expect(buildBackupReminder([{ id: 'json-1', kind: 'full_json', downloadedAt: '2026-08-24T12:00:00.000Z', schemaVersion: 1 }], '2026-08-27T12:00:00.000Z').reason).toBe('threeDaysSinceJsonBackup');
    expect(buildBackupReminder([{ id: 'json-1', kind: 'full_json', downloadedAt: '2026-08-20T12:00:00.000Z', schemaVersion: 1, reminderDismissedUntil: '2026-08-28T12:00:00.000Z' }], '2026-08-27T12:00:00.000Z').eligible).toBe(false);
  });
});
