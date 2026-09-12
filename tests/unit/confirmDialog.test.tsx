import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../src/design/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  afterEach(cleanup);

  it('focuses the safe action, traps Tab, and lets Escape cancel before submission', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog actions={<><button type="button">Eliminar</button><button data-dialog-safe type="button">Cancelar</button></>} onCancel={onCancel} title="Confirmar acción"><p>Revisa las consecuencias.</p></ConfirmDialog>);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Eliminar' }));
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not allow Escape to close a dialog while its transaction is pending', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog actions={<button data-dialog-safe type="button">Cancelar</button>} busy onCancel={onCancel} title="Guardando"><p>Espera.</p></ConfirmDialog>);

    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('returns focus to the triggering control after a safe cancellation', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)} type="button">Abrir confirmación</button>{open && <ConfirmDialog actions={<button data-dialog-safe onClick={() => setOpen(false)} type="button">Cancelar</button>} onCancel={() => setOpen(false)} title="Confirmar acción"><p>Revisa las consecuencias.</p></ConfirmDialog>}</>;
    }
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Abrir confirmación' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(trigger);
  });
});
