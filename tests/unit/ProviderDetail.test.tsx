import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ProviderDetail } from '../../src/features/providers/ProviderDetail';

afterEach(cleanup);

describe('ProviderDetail', () => {
  it('asks before discarding an edited Provider draft', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProviderDetail onClose={onClose} onSave={vi.fn()} provider={{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }} />);

    await user.type(screen.getByLabelText('Contacto'), 'Andrea');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('captures required Provider data and optional operational details without an implicit currency', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderDetail onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Nombre del proveedor'), 'Hotel Aurora');
    await user.click(screen.getByLabelText('USD'));
    await user.type(screen.getByLabelText('Contacto'), 'Andrea');
    await user.type(screen.getByLabelText('Referencia'), 'AUR-123');
    await user.click(screen.getByRole('button', { name: 'Guardar proveedor' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], contactName: 'Andrea', references: ['AUR-123'] }));
  });

  it('does not save a provider with an invalid email', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderDetail onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Nombre del proveedor'), 'Hotel Aurora');
    await user.click(screen.getByLabelText('USD'));
    await user.type(screen.getByLabelText('Correo'), 'hotel@');
    await user.click(screen.getByRole('button', { name: 'Guardar proveedor' }));

    expect(screen.getByRole('alert').textContent).toBe('Indica un correo válido o déjalo vacío.');
    expect(screen.getByLabelText('Correo').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Correo').getAttribute('aria-describedby')).toBe('provider-email-error');
    expect(document.getElementById('provider-email-error')?.textContent).toBe('Indica un correo válido o déjalo vacío.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('uses the independent calling-code picker for a Provider phone', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderDetail onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText('Nombre del proveedor'), 'Hotel Aurora');
    await user.click(screen.getByLabelText('USD'));
    const countryCode = screen.getByRole('combobox', { name: 'Código internacional' });
    await user.click(countryCode);
    await user.type(countryCode, 'Panama');
    await user.keyboard('{ArrowDown}{Enter}');
    await user.type(screen.getByRole('textbox', { name: 'Teléfono' }), '60000000');
    await user.click(screen.getByRole('button', { name: 'Guardar proveedor' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ phone: '+50760000000' }));
  });

  it('shows the Provider task templates only when its tab is selected', async () => {
    const user = userEvent.setup();
    const onSaveTemplate = vi.fn().mockResolvedValue(undefined);
    render(<ProviderDetail onClose={vi.fn()} onSave={vi.fn().mockResolvedValue(undefined)} onSaveTemplate={onSaveTemplate} provider={{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }} templates={[]} />);

    await user.click(screen.getByRole('tab', { name: 'Plantillas de tareas' }));
    await user.type(screen.getByLabelText('Título de plantilla'), 'Solicitar confirmación');
    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));

    expect(onSaveTemplate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Solicitar confirmación' }));
  });

  it('edits the 80/100 agency share and fixed gross-commission rate in its own tab', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProviderDetail onClose={vi.fn()} onSave={onSave} provider={{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }} />);

    await user.click(screen.getByRole('tab', { name: 'Comisiones' }));
    await user.selectOptions(screen.getByLabelText('Participación de agencia'), '1');
    await user.selectOptions(screen.getByLabelText('Modo de comisión bruta'), 'fixed_percentage');
    await user.clear(screen.getByLabelText('Porcentaje bruto estándar'));
    await user.type(screen.getByLabelText('Porcentaje bruto estándar'), '12');
    await user.click(screen.getByRole('button', { name: 'Guardar reglas de comisión' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ commissionRate: 1, grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.12 }));
  });

  it('translates every provider form control while preserving entered content', () => {
    render(<LocaleProvider locale="en"><ProviderDetail onClose={vi.fn()} onSave={vi.fn()} provider={{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }} /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'Hotel Aurora' })).toBeTruthy();
    expect(screen.getByLabelText('Provider name')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Commissions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save provider' })).toBeTruthy();
  });

  it('offers a full-workspace action only when the parent can open it', async () => {
    const user = userEvent.setup();
    const onOpenWorkspace = vi.fn();
    render(<ProviderDetail onClose={vi.fn()} onOpenWorkspace={onOpenWorkspace} onSave={vi.fn()} provider={{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }} />);

    await user.click(screen.getByRole('button', { name: 'Abrir expediente completo' }));

    expect(onOpenWorkspace).toHaveBeenCalledTimes(1);
  });
});
