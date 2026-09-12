import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastRegion } from '../../src/design/components/ToastRegion';

afterEach(cleanup);

describe('ToastRegion', () => {
  it('announces a reversible action and lets the user undo it', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<ToastRegion actionLabel="Deshacer" message="Lead archivado" onAction={onUndo} />);

    expect(screen.getByRole('status').textContent).toContain('Lead archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('waits six seconds and pauses its expiry while the reversible action is being read or focused', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<ToastRegion actionLabel="Deshacer" message="Lead archivado" onAction={vi.fn()} onDismiss={onDismiss} />);

    const toast = screen.getByRole('status');
    act(() => { vi.advanceTimersByTime(5_999); });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.mouseEnter(toast);
    act(() => { vi.advanceTimersByTime(6_000); });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(toast);
    act(() => { vi.advanceTimersByTime(6_000); });
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
