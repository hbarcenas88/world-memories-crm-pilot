import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionMenu } from '../../src/design/components/ActionMenu';

describe('ActionMenu', () => {
  afterEach(cleanup);
  it('focuses the first action when opened and closes with Escape', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ActionMenu label="Acciones para Consulta de prueba" actions={[
      { id: 'edit', label: 'Editar', onSelect: onEdit },
      { id: 'archive', label: 'Archivar', onSelect: vi.fn() },
    ]} />);

    await user.click(screen.getByRole('button', { name: 'Acciones para Consulta de prueba' }));

    const edit = screen.getByRole('menuitem', { name: 'Editar' });
    expect(document.activeElement).toBe(edit);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Acciones para Consulta de prueba' }));
  });

  it('moves through actions with arrows, Home and End', async () => {
    const user = userEvent.setup();
    render(<ActionMenu label="Acciones" actions={[
      { id: 'edit', label: 'Editar', onSelect: vi.fn() },
      { id: 'archive', label: 'Archivar', onSelect: vi.fn() },
      { id: 'delete', label: 'Eliminar', onSelect: vi.fn() },
    ]} />);
    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Archivar' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Eliminar' }));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Editar' }));
  });

  it('closes when focus leaves with Tab or when the user clicks outside', async () => {
    const user = userEvent.setup();
    render(<><ActionMenu label="Acciones" actions={[{ id: 'edit', label: 'Editar', onSelect: vi.fn() }]} /><button type="button">Fuera</button></>);
    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
