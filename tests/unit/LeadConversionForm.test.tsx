import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { LeadConversionForm } from '../../src/features/leads/LeadConversionForm';

afterEach(cleanup);

describe('LeadConversionForm', () => {
  it('does not allow conversion until the first payment includes an amount and currency', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<LeadConversionForm clients={[]} onCancel={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }));
    expect(screen.getByText('Ingresa el anticipo y su moneda antes de confirmar la venta.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('can carry an existing Client selection into the conversion', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<LeadConversionForm clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-25T00:00:00.000Z', members: [{ id: 'member-1', name: 'Ana Rivera', status: 'active' }] }]} onCancel={vi.fn()} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByLabelText('Cliente'), 'client-1');
    await user.type(screen.getByLabelText('Anticipo'), '500');
    await user.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }));

    expect(screen.getByLabelText('Contacto principal')).toBeTruthy();
    expect(onConfirm).toHaveBeenCalledWith({ amount: 500, currency: 'USD', clientId: 'client-1', primaryMemberId: 'member-1' });
  });

  it('translates conversion controls and preserves client names', () => {
    render(<LocaleProvider locale="en"><LeadConversionForm clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-25T00:00:00.000Z' }]} onCancel={vi.fn()} onConfirm={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('heading', { name: 'Record first payment' })).toBeTruthy();
    expect(screen.getByLabelText('Advance')).toBeTruthy();
    expect(screen.getByText('Familia Rivera')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm sale' })).toBeTruthy();
  });
});
