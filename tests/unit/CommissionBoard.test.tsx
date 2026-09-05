import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommissionBoard } from '../../src/features/commissions/CommissionBoard';

describe('CommissionBoard', () => {
  afterEach(cleanup);

  it('separates overdue, upcoming and paid commissions while preserving the Tracking Form reference', () => {
    render(<CommissionBoard
      onMarkPaid={vi.fn()}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T00:00:00.000Z' }]}
      today="2026-08-26"
      commissions={[
        { id: 'overdue', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, dueOn: '2026-08-20', trackingReference: 'TF-11', status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' },
        { id: 'upcoming', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 200, currency: 'USD' }, dueOn: '2026-08-30', status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' },
        { id: 'paid', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, status: 'paid', received: { amount: 80, currency: 'USD' }, paidOn: '2026-08-19', createdAt: '2026-08-01T00:00:00.000Z' },
      ]}
    />);

    expect(screen.getByRole('heading', { name: 'Vencidas' })).toBeTruthy();
    expect(screen.getByDisplayValue('TF-11')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Próximas' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pagadas' })).toBeTruthy();
  });

  it('shows expected and received totals separately for every currency', () => {
    render(<CommissionBoard
      onMarkPaid={vi.fn()}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD', 'MXN'], createdAt: '2026-08-26T00:00:00.000Z' }]}
      commissions={[
        { id: 'expected-usd', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' },
        { id: 'paid-usd', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, received: { amount: 75, currency: 'USD' }, status: 'paid', createdAt: '2026-08-01T00:00:00.000Z' },
        { id: 'expected-mxn', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 200, currency: 'MXN' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' },
      ]}
    />);

    const totals = screen.getByLabelText('Totales por moneda');
    expect(totals.textContent).toContain('USD');
    expect(totals.textContent).toContain('180.00 USD');
    expect(totals.textContent).toContain('75.00 USD');
    expect(totals.textContent).toContain('200.00 MXN');
  });

  it('keeps archived commissions out of the active board and exposes their visible lifecycle action', async () => {
    const user = userEvent.setup();
    const loadImpact = vi.fn().mockResolvedValue({ target: { kind: 'commission', id: 'archived' }, title: 'Comisión', dependencies: [], canDelete: true });
    render(<CommissionBoard
      commissions={[
        { id: 'active', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-08-01T00:00:00.000Z' },
        { id: 'archived', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, status: 'expected', archivedAt: '2026-08-20T00:00:00.000Z', createdAt: '2026-08-01T00:00:00.000Z' },
      ]}
      loadImpact={loadImpact}
      onArchive={vi.fn()}
      onDelete={vi.fn()}
      onMarkPaid={vi.fn()}
      onRestore={vi.fn()}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T00:00:00.000Z' }]}
    />);

    expect(screen.getAllByRole('button', { name: 'Acciones de la comisión Hotel Aurora' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    await user.click(screen.getByRole('button', { name: 'Acciones de la comisión Hotel Aurora' }));
    expect(screen.getByRole('menuitem', { name: 'Restaurar' })).toBeTruthy();
  });
});
