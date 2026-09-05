import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommissionDetail } from '../../src/features/commissions/CommissionDetail';

afterEach(cleanup);

describe('CommissionDetail', () => {
  it('shows the received difference note and opens the related trip or provider', async () => {
    const user = userEvent.setup();
    const onOpenTrip = vi.fn();
    const onOpenProvider = vi.fn();
    render(<CommissionDetail
      commission={{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, received: { amount: 95, currency: 'USD' }, paymentNote: 'Cargo bancario', status: 'paid', createdAt: '2026-08-20T00:00:00.000Z' }}
      onMarkPaid={vi.fn()}
      onOpenProvider={onOpenProvider}
      onOpenTrip={onOpenTrip}
      onUpdateTracking={vi.fn()}
      providerName="Hotel Aurora"
    />);

    expect(screen.getByText('Cargo bancario')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Abrir viaje' }));
    await user.click(screen.getByRole('button', { name: 'Abrir proveedor' }));
    expect(onOpenTrip).toHaveBeenCalledOnce();
    expect(onOpenProvider).toHaveBeenCalledOnce();
  });

  it('lets the user set one Commission projection rate or explicitly return it to the Trip rate', async () => {
    const user = userEvent.setup();
    const onUpdateProjectionRate = vi.fn();
    const commission = { id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' as const }, status: 'expected' as const, createdAt: '2026-08-20T00:00:00.000Z', projectionRateBaseCurrency: 'USD' as const, projectionRateQuoteCurrency: 'MXN' as const, projectionExchangeRate: 18.5, projectionRateSource: 'trip_reference' as const, projectedReferenceAmount: { amount: 1850, currency: 'MXN' as const } };
    render(<CommissionDetail
      commission={commission}
      onMarkPaid={vi.fn()}
      onUpdateProjectionRate={onUpdateProjectionRate}
      onUpdateTracking={vi.fn()}
      providerName="Hotel Aurora"
    />);

    expect(screen.getByText('Sigue la tasa del viaje')).toBeTruthy();
    await user.clear(screen.getByLabelText('Tasa propia de proyección'));
    await user.type(screen.getByLabelText('Tasa propia de proyección'), '19');
    await user.click(screen.getByRole('button', { name: 'Usar tasa propia' }));
    expect(onUpdateProjectionRate).toHaveBeenCalledWith(expect.objectContaining({ commissionId: 'commission-1', mode: 'override', baseCurrency: 'USD', quoteCurrency: 'MXN', exchangeRate: 19 }));

    render(<CommissionDetail
      commission={{ ...commission, projectionRateSource: 'commission_override', projectionExchangeRate: 19, projectedReferenceAmount: { amount: 1900, currency: 'MXN' } }}
      onMarkPaid={vi.fn()}
      onUpdateProjectionRate={onUpdateProjectionRate}
      onUpdateTracking={vi.fn()}
      providerName="Hotel Aurora"
    />);
    await user.click(screen.getByRole('button', { name: 'Volver a usar tasa del viaje' }));
    expect(onUpdateProjectionRate).toHaveBeenCalledWith({ commissionId: 'commission-1', mode: 'follow_trip' });
  });
});
