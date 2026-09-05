import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DetailWorkspace } from '../../src/design/components/DetailWorkspace';

describe('DetailWorkspace', () => {
  it('keeps an accessible breadcrumb and returns to the previous context', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DetailWorkspace breadcrumb={['Leads', 'Consulta de prueba']} onClose={onClose} title="Consulta de prueba">
      <p>Contenido del expediente</p>
    </DetailWorkspace>);

    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' }).textContent).toContain('Leads');
    expect(screen.getByRole('heading', { name: 'Consulta de prueba' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
