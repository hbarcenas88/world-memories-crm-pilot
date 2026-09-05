import type { WorkspaceRepository } from '../../application/ports';
import { assertWorkspaceSnapshot, snapshotCounts, type LegacyWorkspaceSnapshot, type WorkspaceSnapshot, type WorkspaceSnapshotCounts, upgradeWorkspaceSnapshot, workspaceSnapshotVersion } from '../../application/workspaceSnapshot';

type BackupEnvelope = Readonly<{ format: 'world-memories-backup'; schemaVersion: number; checksum: string; snapshot: WorkspaceSnapshot | LegacyWorkspaceSnapshot }>;
export type BackupReadResult = Readonly<{ schemaVersion: number; counts: WorkspaceSnapshotCounts; snapshot: WorkspaceSnapshot }>;

async function checksum(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function backupFileName(now = new Date()): string {
  return `world-memories-backup-${now.toISOString().replace(/[:.]/g, '').replace('Z', 'Z')}.json`;
}

export async function exportBackup(workspace: WorkspaceSnapshot): Promise<Blob> {
  assertWorkspaceSnapshot(workspace);
  const serializedSnapshot = JSON.stringify(workspace);
  const envelope: BackupEnvelope = { format: 'world-memories-backup', schemaVersion: workspaceSnapshotVersion, checksum: await checksum(serializedSnapshot), snapshot: workspace };
  return new Blob([JSON.stringify(envelope)], { type: 'application/json' });
}

export async function readBackup(file: Blob): Promise<BackupReadResult> {
  let envelope: BackupEnvelope;
  try { envelope = JSON.parse(await file.text()) as BackupEnvelope; } catch { throw new Error('backup file is not valid JSON'); }
  if (envelope.format !== 'world-memories-backup' || (envelope.schemaVersion !== 1 && envelope.schemaVersion !== workspaceSnapshotVersion) || !envelope.snapshot) throw new Error('backup schema version is not supported');
  if (envelope.checksum !== await checksum(JSON.stringify(envelope.snapshot))) throw new Error('backup checksum does not match its contents');
  const snapshot = upgradeWorkspaceSnapshot(envelope.snapshot);
  assertWorkspaceSnapshot(snapshot);
  return { schemaVersion: snapshot.schemaVersion, counts: snapshotCounts(snapshot), snapshot };
}

export async function restoreBackup(file: Blob, repository: WorkspaceRepository): Promise<void> {
  const backup = await readBackup(file);
  await repository.replaceSnapshot(backup.snapshot);
}
