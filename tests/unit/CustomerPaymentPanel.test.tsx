import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { CustomerPaymentPanel } from '../../src/features/trips/CustomerPaymentPanel';

afterEach(cleanup);

describe('CustomerPaymentPanel', () => {
  it('formats a new customer payment while recording its unlocalized amount', async () => {
    const user = userEvent.setup();
    const onRecordPayment = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 1500 }]}
      onRecordPayment={onRecordPayment}
      payments={[]}
    />);

    await user.type(screen.getByLabelText('Importe del pago de Hotel familiar'), '1234.5');

    expect((screen.getByLabelText('Importe del pago de Hotel familiar') as HTMLInputElement).value).toBe('1,234.5');

    fireEvent.change(screen.getByLabelText('Fecha efectiva del pago de Hotel familiar'), { target: { value: '12/11/2026' } });
    await user.click(screen.getByRole('button', { name: 'Registrar pago de Hotel familiar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro de pago' }));

    expect(onRecordPayment).toHaveBeenCalledWith({ serviceProviderId: 'component-1', amount: { amount: 1234.5, currency: 'USD' }, occurredOn: '2026-11-12' });
  });

  it('derives the component balance, exposes due reminders and records the effective payment date', async () => {
    const user = userEvent.setup();
    const onRecordPayment = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 900, customerBalanceDueOn: '2026-12-30' }]}
      payments={[{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z', status: 'received', source: 'customer_payment' }]}
      onRecordPayment={onRecordPayment}
    />);

    expect(screen.getByText('Saldo pendiente: 650.00 USD')).toBeTruthy();
    expect(screen.getByText('Recordatorios internos: 30/11/2026 · 23/12/2026 · 29/12/2026 · 30/12/2026')).toBeTruthy();

    await user.clear(screen.getByLabelText('Importe del pago de Hotel familiar'));
    await user.type(screen.getByLabelText('Importe del pago de Hotel familiar'), '200');
    fireEvent.change(screen.getByLabelText('Fecha efectiva del pago de Hotel familiar'), { target: { value: '12/11/2026' } });
    await user.click(screen.getByRole('button', { name: 'Registrar pago de Hotel familiar' }));

    expect(screen.getByRole('dialog', { name: 'Confirmar registro de pago' })).toBeTruthy();
    expect(onRecordPayment).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect((screen.getByLabelText('Importe del pago de Hotel familiar') as HTMLInputElement).value).toBe('200.00');
    await user.click(screen.getByRole('button', { name: 'Registrar pago de Hotel familiar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar registro de pago' }));

    expect(onRecordPayment).toHaveBeenCalledWith({ serviceProviderId: 'component-1', amount: { amount: 200, currency: 'USD' }, occurredOn: '2026-11-12' });
  });

  it('assigns the original conversion payment to a compatible component without recording it twice', async () => {
    const user = userEvent.setup();
    const onAssignInitialPayment = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 900 }]}
      onAssignInitialPayment={onAssignInitialPayment}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[{ id: 'payment-1', tripId: 'trip-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z', status: 'received', source: 'first_conversion_payment' }]}
    />);

    expect(screen.getByText('Anticipo de conversión: 250.00 USD')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Asignar anticipo de conversión'), 'component-1');
    await user.click(screen.getByRole('button', { name: 'Asignar anticipo a Hotel familiar' }));

    expect(onAssignInitialPayment).toHaveBeenCalledWith({ paymentId: 'payment-1', serviceProviderId: 'component-1' });
  });

  it('allows an explicit correction of a saved payment instead of silently overwriting it', async () => {
    const user = userEvent.setup();
    const onCorrectPayment = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 900 }]}
      onCorrectPayment={onCorrectPayment}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T12:00:00.000Z', status: 'received', source: 'customer_payment' }]}
    />);

    await user.click(screen.getByRole('button', { name: 'Editar pago: payment-1' }));
    await user.clear(screen.getByLabelText('Corrección de importe payment-1'));
    await user.type(screen.getByLabelText('Corrección de importe payment-1'), '275');
    fireEvent.change(screen.getByLabelText('Corrección de fecha payment-1'), { target: { value: '21/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-1' }));
    expect(screen.getByRole('dialog', { name: 'Confirmar corrección de pago' })).toBeTruthy();
    expect(onCorrectPayment).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar corrección de pago' }));

    expect(onCorrectPayment).toHaveBeenCalledWith({ paymentId: 'payment-1', amount: { amount: 275, currency: 'USD' }, occurredOn: '2026-08-21' });
  });

  it('formats a payment correction while retaining its unlocalized amount', async () => {
    const user = userEvent.setup();
    const onCorrectPayment = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 1500 }]}
      onCorrectPayment={onCorrectPayment}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T12:00:00.000Z', status: 'received', source: 'customer_payment' }]}
    />);

    await user.click(screen.getByRole('button', { name: 'Editar pago: payment-1' }));
    await user.clear(screen.getByLabelText('Corrección de importe payment-1'));
    await user.type(screen.getByLabelText('Corrección de importe payment-1'), '1234.5');

    expect((screen.getByLabelText('Corrección de importe payment-1') as HTMLInputElement).value).toBe('1,234.5');

    fireEvent.change(screen.getByLabelText('Corrección de fecha payment-1'), { target: { value: '21/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-1' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar corrección de pago' }));

    expect(onCorrectPayment).toHaveBeenCalledWith({ paymentId: 'payment-1', amount: { amount: 1234.5, currency: 'USD' }, occurredOn: '2026-08-21' });
  });

  it('exposes the explicit commission enable action only for a component marked Sin comisión', async () => {
    const user = userEvent.setup();
    const onEnableCommission = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', commissionStatus: 'without_commission' }]}
      onEnableCommission={onEnableCommission}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[]}
    />);

    await user.click(screen.getByRole('button', { name: 'Habilitar comisión' }));
    expect(onEnableCommission).toHaveBeenCalledWith('component-1');
  });

  it('requires an explicit component and commission outcome before recording a cancellation', async () => {
    const user = userEvent.setup();
    const onRecordCancellation = vi.fn().mockResolvedValue(undefined);
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', commissionStatus: 'with_commission' }]}
      onRecordCancellation={onRecordCancellation}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[]}
    />);

    await user.click(screen.getByRole('button', { name: 'Registrar cancelación de Hotel familiar' }));
    await user.selectOptions(screen.getByLabelText('Resultado de cancelación para Hotel familiar'), 'partial');
    await user.selectOptions(screen.getByLabelText('Resultado de Comisión para Hotel familiar'), 'cancel');
    await user.click(screen.getByRole('button', { name: 'Confirmar resultado de cancelación' }));

    expect(onRecordCancellation).toHaveBeenCalledWith({ serviceProviderId: 'component-1', cancellationOutcome: 'partial', commissionOutcome: 'cancel' });
  });

  it('renders payment labels and reminders in English without translating component names', () => {
    render(<LocaleProvider locale="en"><CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 900, customerBalanceDueOn: '2026-12-30' }]}
      payments={[{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'USD' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z', status: 'received', source: 'customer_payment' }]}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
    /></LocaleProvider>);

    expect(screen.getByRole('region', { name: 'Customer payments' })).toBeTruthy();
    expect(screen.getByText('Total paid: 250.00 USD')).toBeTruthy();
    expect(screen.getByText('Due date: 30/12/2026.')).toBeTruthy();
    expect(screen.getByText('Internal reminders: 30/11/2026 · 23/12/2026 · 29/12/2026 · 30/12/2026')).toBeTruthy();
    expect(screen.getByLabelText('Payment amount for Hotel familiar')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Record payment for Hotel familiar' })).toBeTruthy();
  });

  it('does not add payments in different currencies into a component balance', () => {
    render(<CustomerPaymentPanel
      components={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Hotel Aurora', currency: 'USD', saleAmount: 900 }]}
      onRecordPayment={vi.fn().mockResolvedValue(undefined)}
      payments={[{ id: 'payment-1', tripId: 'trip-1', serviceProviderId: 'component-1', amount: { amount: 250, currency: 'MXN' }, occurredAt: '2026-08-26T12:00:00.000Z', recordedAt: '2026-08-26T12:00:00.000Z', status: 'received', source: 'customer_payment' }]}
    />);

    expect(screen.getByText('Saldo pendiente no calculable: los pagos tienen otra moneda')).toBeTruthy();
    expect(screen.queryByText('Saldo pendiente: 650.00 USD')).toBeNull();
  });
});
