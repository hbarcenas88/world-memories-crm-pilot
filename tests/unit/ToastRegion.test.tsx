import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastRegion } from '../../src/design/components/ToastRegion';

describe('ToastRegion', () => {
  it('announces a reversible action and lets the user undo it', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<ToastRegion actionLabel="Deshacer" message="Lead archivado" onAction={onUndo} />);

    expect(screen.getByRole('status').textContent).toContain('Lead archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});
