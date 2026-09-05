import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ProviderDetail } from '../../src/features/providers/ProviderDetail';

afterEach(cleanup);

describe('ProviderDetail', () => {
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
