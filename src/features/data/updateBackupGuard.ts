import type { BackupDownload } from '../../domain/types';

export function hasCurrentJsonBackup(downloads: readonly BackupDownload[], schemaVersion: number, latestWorkspaceChangeAt: string): boolean {
  return downloads.some((backup) => backup.kind === 'full_json' && backup.schemaVersion >= schemaVersion && backup.downloadedAt >= latestWorkspaceChangeAt);
}
