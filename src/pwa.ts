import { registerSW } from 'virtual:pwa-register';
import { workspaceSnapshotVersion } from './application/workspaceSnapshot';

const updateCheckIntervalMs = 60 * 60 * 1000;

export type PwaUpdateMetadata = Readonly<{ requiresBackup: boolean }>;

type UpdateInfo = Readonly<{ workspaceSnapshotVersion?: unknown }>;

/**
 * The update marker stays outside the precache so an open version can decide
 * whether the incoming build changes the JSON/data schema before it activates.
 * Any missing or malformed marker takes the conservative backup-required path.
 */
export async function getUpdateMetadata(): Promise<PwaUpdateMetadata> {
  try {
    const response = await fetch(new URL('./world-memories-update.json', document.baseURI), { cache: 'no-store' });
    if (!response.ok) return { requiresBackup: true };
    const updateInfo = await response.json() as UpdateInfo;
    return { requiresBackup: updateInfo.workspaceSnapshotVersion !== workspaceSnapshotVersion };
  } catch {
    return { requiresBackup: true };
  }
}

export function registerPwa(onUpdateAvailable: (apply: () => Promise<void>, metadata: PwaUpdateMetadata) => void): () => void {
  if (!('serviceWorker' in navigator)) return () => undefined;
  let cleanup = (): void => undefined;
  const update = registerSW({
    immediate: true,
    async onNeedRefresh() {
      onUpdateAvailable(async () => {
        await update(true);
      }, await getUpdateMetadata());
    },
    onRegisteredSW(_scriptUrl, registration) {
      if (!registration) return;
      const checkForUpdate = (): void => {
        if (document.visibilityState === 'visible' && navigator.onLine) void registration.update();
      };
      const interval = globalThis.setInterval(checkForUpdate, updateCheckIntervalMs);
      globalThis.addEventListener('online', checkForUpdate);
      document.addEventListener('visibilitychange', checkForUpdate);
      cleanup = (): void => {
        globalThis.clearInterval(interval);
        globalThis.removeEventListener('online', checkForUpdate);
        document.removeEventListener('visibilitychange', checkForUpdate);
      };
    },
  });
  return () => cleanup();
}
