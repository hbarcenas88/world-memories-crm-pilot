import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../../src/design/components/FilterBar';

afterEach(cleanup);

describe('FilterBar', () => {
  it('uses a compact filter trigger and only reveals its controls on request', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<FilterBar label="Filtrar tareas" onClear={onClear}><label>Estado<input aria-label="Estado" defaultValue="Abiertas" /></label></FilterBar>);

    const trigger = screen.getByRole('button', { name: 'Filtrar tareas' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByLabelText('Estado').closest('[hidden]')).toBeTruthy();
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText('Estado').closest('[hidden]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
