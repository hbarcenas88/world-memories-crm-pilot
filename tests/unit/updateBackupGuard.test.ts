import { describe, expect, it } from 'vitest';
import { hasCurrentJsonBackup } from '../../src/features/data/updateBackupGuard';

describe('hasCurrentJsonBackup', () => {
  it('requires a JSON backup of the current schema made after the latest workspace change', () => {
    const latestChange = '2026-09-04T16:00:00.000Z';
    expect(hasCurrentJsonBackup([{ id: 'old', kind: 'full_json', schemaVersion: 2, downloadedAt: '2026-09-04T15:59:59.000Z' }], 2, latestChange)).toBe(false);
    expect(hasCurrentJsonBackup([{ id: 'current', kind: 'full_json', schemaVersion: 2, downloadedAt: latestChange }], 2, latestChange)).toBe(true);
    expect(hasCurrentJsonBackup([{ id: 'excel', kind: 'operational_excel', schemaVersion: 2, downloadedAt: '2026-09-04T17:00:00.000Z' }], 2, latestChange)).toBe(false);
  });
});
