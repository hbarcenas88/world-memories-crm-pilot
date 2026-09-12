import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoot } from '../../src/app/AppRoot';

let notifyUpdate: ((apply: () => Promise<void>, metadata?: { requiresBackup: boolean }) => void) | undefined;

vi.mock('../../src/pwa', () => ({
  registerPwa: (onUpdateAvailable: (apply: () => Promise<void>, metadata?: { requiresBackup: boolean }) => void) => {
    notifyUpdate = onUpdateAvailable;
  },
}));

vi.mock('../../src/app/App', () => ({
  App: ({ applyUpdate, requiresBackupForUpdate }: { applyUpdate?: () => Promise<void>; requiresBackupForUpdate?: boolean }) => (
    <button data-requires-backup={String(requiresBackupForUpdate)} disabled={!applyUpdate} onClick={() => { void applyUpdate?.(); }} type="button">
      Apply update
    </button>
  ),
}));

describe('AppRoot PWA update integration', () => {
  afterEach(() => {
    cleanup();
    notifyUpdate = undefined;
  });

  it('stores an available update without applying it before the operator confirms', async () => {
    let applied = 0;
    render(<AppRoot />);

    await act(async () => {
      notifyUpdate!(async () => { applied += 1; });
    });

    expect(applied).toBe(0);
    expect((screen.getByRole('button', { name: 'Apply update' }) as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Apply update' }));
    });

    expect(applied).toBe(1);
  });

  it('passes the declared backup requirement to the update prompt', async () => {
    render(<AppRoot />);

    await act(async () => {
      notifyUpdate!(async () => undefined, { requiresBackup: false });
    });

    expect(screen.getByRole('button', { name: 'Apply update' }).getAttribute('data-requires-backup')).toBe('false');
  });
});
