import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pwaRuntime = vi.hoisted(() => ({ registerSW: vi.fn() }));

vi.mock('virtual:pwa-register', () => pwaRuntime);

import { getUpdateMetadata, registerPwa } from '../../src/pwa';

describe('registerPwa', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
    pwaRuntime.registerSW.mockReset();
  });

  afterEach(() => {
    if (originalServiceWorker) Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
    else Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('requires a backup conservatively when update metadata cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(getUpdateMetadata()).resolves.toEqual({ requiresBackup: true });
    vi.unstubAllGlobals();
  });

  it('distinguishes a code-only update from a declared backup schema change', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ workspaceSnapshotVersion: 3 }) }));
    await expect(getUpdateMetadata()).resolves.toEqual({ requiresBackup: false });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ workspaceSnapshotVersion: 4 }) }));
    await expect(getUpdateMetadata()).resolves.toEqual({ requiresBackup: true });
    vi.unstubAllGlobals();
  });

  it('waits for the service worker update when the operator applies it', async () => {
    let onNeedRefresh: (() => Promise<void>) | undefined;
    let resolveUpdate: (() => void) | undefined;
    pwaRuntime.registerSW.mockImplementation((options: { onNeedRefresh: () => Promise<void> }) => {
      onNeedRefresh = options.onNeedRefresh;
      return () => new Promise<void>((resolve) => { resolveUpdate = resolve; });
    });
    let apply: (() => Promise<void>) | undefined;

    registerPwa((received) => { apply = received; });
    await onNeedRefresh!();

    let completed = false;
    const applying = apply!().then(() => { completed = true; });
    await Promise.resolve();
    expect(completed).toBe(false);

    resolveUpdate!();
    await applying;
    expect(completed).toBe(true);
  });

  it('checks for a newer service worker while the app remains open', async () => {
    vi.useFakeTimers();
    const registration = { update: vi.fn().mockResolvedValue(undefined) } as unknown as ServiceWorkerRegistration;
    pwaRuntime.registerSW.mockImplementation((options: { onRegisteredSW: (url: string, registration: ServiceWorkerRegistration) => void }) => {
      options.onRegisteredSW('/sw.js', registration);
      return vi.fn();
    });

    const stop = registerPwa(() => undefined);
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(registration.update).toHaveBeenCalledTimes(1);
    stop();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(registration.update).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
