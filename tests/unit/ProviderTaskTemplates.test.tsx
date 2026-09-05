import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ProviderTaskTemplates } from '../../src/features/providers/ProviderTaskTemplates';

afterEach(cleanup);

describe('ProviderTaskTemplates', () => {
  it('adds an editable active template with its due-date rule', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderTaskTemplates onSave={onSave} templates={[]} />);

    await user.type(screen.getByLabelText('Título de plantilla'), 'Solicitar confirmación');
    await user.click(screen.getByLabelText('Obligatoria'));
    await user.selectOptions(screen.getByLabelText('Referencia de fecha'), 'trip_start');
    await user.clear(screen.getByLabelText('Días relativos'));
    await user.type(screen.getByLabelText('Días relativos'), '-14');
    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Solicitar confirmación', required: true, relativeTo: 'trip_start', offsetDays: -14, active: true }));
  });

  it('edits and deactivates an existing template without changing prior tasks', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderTaskTemplates onSave={onSave} templates={[{ id: 'template-1', providerId: 'provider-1', title: 'Solicitar confirmación', required: false, relativeTo: 'manual', active: true, createdAt: '2026-08-26T12:00:00.000Z' }]} />);

    await user.click(screen.getByRole('button', { name: 'Editar plantilla: Solicitar confirmación' }));
    await user.clear(screen.getByLabelText('Título de plantilla'));
    await user.type(screen.getByLabelText('Título de plantilla'), 'Confirmar reserva');
    await user.click(screen.getByRole('button', { name: 'Desactivar plantilla' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'template-1', title: 'Confirmar reserva', active: false }));
  });

  it('translates the template controls into English without translating a saved task title', () => {
    render(<LocaleProvider locale="en"><ProviderTaskTemplates onSave={vi.fn()} templates={[{ id: 'template-1', providerId: 'provider-1', title: 'Confirmar reserva', required: true, relativeTo: 'trip_start', active: true, createdAt: '2026-08-26T12:00:00.000Z' }]} /></LocaleProvider>);

    expect(screen.getByLabelText('Task templates')).toBeTruthy();
    expect(screen.getByLabelText('Template title')).toBeTruthy();
    expect(screen.getByText(/Confirmar reserva/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save template' })).toBeTruthy();
  });
});
