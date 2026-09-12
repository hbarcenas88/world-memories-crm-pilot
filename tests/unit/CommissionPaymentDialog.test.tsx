import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { CommissionPaymentDialog } from '../../src/features/commissions/CommissionPaymentDialog';

afterEach(cleanup);

describe('CommissionPaymentDialog', () => {
  it('formats the received commission amount while confirming its unlocalized number', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<CommissionPaymentDialog commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' }} onCancel={vi.fn()} onConfirm={onConfirm} />);

    await user.clear(screen.getByLabelText('Importe recibido'));
    await user.type(screen.getByLabelText('Importe recibido'), '1234.5');

    expect((screen.getByLabelText('Importe recibido') as HTMLInputElement).value).toBe('1,234.5');

    await user.click(screen.getByLabelText('Confirmo la diferencia'));
    await user.click(screen.getByRole('button', { name: 'Guardar pago' }));

    expect(onConfirm).toHaveBeenCalledWith({ amount: 1234.5, currency: 'USD' }, true, expect.any(String), undefined);
  });

  it('asks before discarding a changed commission payment draft', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<CommissionPaymentDialog commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' }} onCancel={onCancel} onConfirm={vi.fn()} />);

    await user.clear(screen.getByLabelText('Importe recibido'));
    await user.type(screen.getByLabelText('Importe recibido'), '95');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('treats a changed effective payment date as a draft to protect', async () => {
    const user = userEvent.setup();
    render(<CommissionPaymentDialog commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' }} onCancel={vi.fn()} onConfirm={vi.fn()} />);

    await user.clear(screen.getByLabelText('Fecha efectiva de pago'));
    await user.type(screen.getByLabelText('Fecha efectiva de pago'), '31/08/2026');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
  });

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
