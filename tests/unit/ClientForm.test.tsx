import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ClientForm } from '../../src/features/clients/ClientForm';

afterEach(cleanup);

describe('ClientForm', () => {
  it('preloads and saves editable family details and existing members', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClientForm client={{ id: 'client-1', name: 'Familia Rivera', familyNote: 'Prefiere suites', createdAt: '2026-08-20T00:00:00.000Z', members: [{ id: 'member-1', name: 'Lucía', status: 'active' }] }} onCancel={vi.fn()} onSave={onSave} />);

    expect(screen.getByLabelText('Nombre de cliente o familia').getAttribute('value')).toBe('Familia Rivera');
    await user.type(screen.getByLabelText('Dirección'), 'Vía España, Panamá');
    await user.clear(screen.getByLabelText('Nota útil de familia'));
    await user.type(screen.getByLabelText('Nota útil de familia'), 'Prefiere villas');
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }));

    expect(onSave).toHaveBeenCalledWith({ name: 'Familia Rivera', familyNote: 'Prefiere villas', address: 'Vía España, Panamá', members: [{ id: 'member-1', name: 'Lucía', status: 'active' }] });
    expect(screen.getByDisplayValue('Lucía')).toBeTruthy();
  });

  it('adds a dated family member and derives their current age without persisting an age field', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClientForm onCancel={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Nombre de cliente o familia'), 'Familia Rivera');
    await user.type(screen.getByLabelText('Nombre del miembro'), 'Lucía');
    await user.type(screen.getByLabelText('Fecha de nacimiento del miembro'), '15/08/2017');
    await user.click(screen.getByRole('button', { name: 'Añadir miembro' }));

    expect(screen.getByText(/Edad actual:/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }));
    expect(onSave.mock.calls[0][0].members[0]).toMatchObject({ name: 'Lucía', birthDate: '2017-08-15', status: 'active' });
    expect(onSave.mock.calls[0][0].members[0]).not.toHaveProperty('age');
  });

  it('translates form controls without changing entered family values', () => {
    render(<LocaleProvider locale="en"><ClientForm client={{ id: 'client-1', name: 'Familia Rivera', familyNote: 'Prefiere suites', createdAt: '2026-08-20T00:00:00.000Z' }} onCancel={vi.fn()} onSave={vi.fn()} /></LocaleProvider>);
    expect(screen.getByLabelText('Client or family name')).toBeTruthy();
    expect(screen.getByLabelText('Useful family note')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save client' })).toBeTruthy();
  });
});
