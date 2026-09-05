import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { CommissionPaymentDialog } from '../../src/features/commissions/CommissionPaymentDialog';

afterEach(cleanup);

describe('CommissionPaymentDialog', () => {
  it('requires confirmation for a different received currency and sends the effective payment date', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<CommissionPaymentDialog commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' }} onCancel={vi.fn()} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByLabelText('Moneda recibida'), 'MXN');
    fireEvent.change(screen.getByLabelText('Fecha efectiva de pago'), { target: { value: '30/08/2026' } });
    await user.click(screen.getByLabelText('Confirmo la diferencia'));
    await user.type(screen.getByLabelText('Nota de diferencia'), 'Cargo bancario');
    expect((screen.getByLabelText('Fecha efectiva de pago') as HTMLInputElement).value).toBe('30/08/2026');
    expect((screen.getByRole('button', { name: 'Guardar pago' }) as HTMLButtonElement).disabled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Guardar pago' }));

    expect(onConfirm).toHaveBeenCalledWith({ amount: 100, currency: 'MXN' }, true, '2026-08-30', 'Cargo bancario');
  });

  it('renders commission payment controls in English while preserving ISO currencies', () => {
    render(<LocaleProvider locale="en"><CommissionPaymentDialog commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' }} onCancel={vi.fn()} onConfirm={vi.fn()} /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'Record commission payment' })).toBeTruthy();
    expect(screen.getByLabelText('Received amount')).toBeTruthy();
    expect(screen.getByLabelText('Received currency')).toBeTruthy();
    expect(screen.getByLabelText('Payment effective date')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save payment' })).toBeTruthy();
  });
});
