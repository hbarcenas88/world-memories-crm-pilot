import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionMenu } from '../../src/design/components/ActionMenu';

describe('ActionMenu', () => {
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
});
