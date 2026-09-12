import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentDetail } from '../../src/features/trips/PaymentDetail';

afterEach(cleanup);

describe('PaymentDetail', () => {
  it('formats a full-workspace payment correction while saving its unlocalized amount', async () => {
    const user = userEvent.setup();
    const onCorrect = vi.fn().mockResolvedValue(undefined);
    render(<PaymentDetail onCorrect={onCorrect} payment={{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T12:00:00.000Z', status: 'received', source: 'customer_payment' }} serviceName="Hotel Aurora" />);

    await user.clear(screen.getByLabelText('Corrección de importe payment-1'));
    await user.type(screen.getByLabelText('Corrección de importe payment-1'), '1234.5');

    expect((screen.getByLabelText('Corrección de importe payment-1') as HTMLInputElement).value).toBe('1,234.5');

    fireEvent.change(screen.getByLabelText('Corrección de fecha payment-1'), { target: { value: '21/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-1' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar corrección de pago' }));

    expect(onCorrect).toHaveBeenCalledWith({ paymentId: 'payment-1', amount: { amount: 1234.5, currency: 'USD' }, occurredOn: '2026-08-21' });
  });

  it('asks for an explicit confirmation before correcting a payment from its full workspace', async () => {
    const user = userEvent.setup();
    const onCorrect = vi.fn().mockResolvedValue(undefined);
    render(<PaymentDetail onCorrect={onCorrect} payment={{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T12:00:00.000Z', status: 'received', source: 'customer_payment' }} serviceName="Hotel Aurora" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Detalle de pago' }).closest('.record-header')).toBeTruthy();
    await user.clear(screen.getByLabelText('Corrección de importe payment-1'));
    await user.type(screen.getByLabelText('Corrección de importe payment-1'), '275');
    fireEvent.change(screen.getByLabelText('Corrección de fecha payment-1'), { target: { value: '21/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-1' }));

    expect(screen.getByRole('dialog', { name: 'Confirmar corrección de pago' })).toBeTruthy();
    expect(onCorrect).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect((screen.getByLabelText('Corrección de importe payment-1') as HTMLInputElement).value).toBe('275.00');
  });
});
