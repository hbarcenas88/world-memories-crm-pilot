import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { Dashboard } from '../../src/features/dashboard/Dashboard';

describe('Dashboard', () => {
  afterEach(cleanup);

  it('shows the current operational queues and currency-separated expected commissions', () => {
    render(<Dashboard today="2026-08-26" leads={[{ id: 'lead-1', name: 'Familia', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'quote_preparing', createdAt: '2026-08-20T00:00:00.000Z' }]} trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-08-25', effectiveEndOn: '2026-08-30' }]} tasks={[{ id: 'task-1', title: 'Llamar', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} commissions={[{ id: 'commission-1', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 80, currency: 'USD' }, dueOn: '2026-08-25', status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' }]} />);

    expect(screen.getAllByText('Viajeros en curso')).toHaveLength(1);
    expect(screen.getByText('Comisiones vencidas')).toBeTruthy();
    expect(screen.getAllByText('80 USD')).toHaveLength(2);
  });

  it('shows current and upcoming trips plus the overdue task queue', () => {
    render(<Dashboard today="2026-08-26" leads={[]} commissions={[]} tasks={[{ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} trips={[{ id: 'trip-current', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-08-25', effectiveEndOn: '2026-08-30' }, { id: 'trip-upcoming', leadId: 'lead-2', clientId: 'client-2', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-03', effectiveEndOn: '2026-09-08' }]} />);

    expect(screen.getByRole('heading', { name: 'Próximos viajes' })).toBeTruthy();
    expect(screen.getByText('03/09/2026 — 08/09/2026')).toBeTruthy();
    expect(screen.getByText('Confirmar itinerario')).toBeTruthy();
  });

  it('opens trips and lets the operator complete or reprogram an overdue task from its queue', async () => {
    const user = userEvent.setup();
    const onOpenTrip = vi.fn();
    const onCompleteTask = vi.fn();
    const onRescheduleTask = vi.fn();
    render(<Dashboard today="2026-08-26" leads={[]} commissions={[]} onCompleteTask={onCompleteTask} onOpenTrip={onOpenTrip} onRescheduleTask={onRescheduleTask} tasks={[{ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} trips={[{ id: 'trip-current', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-08-25', effectiveEndOn: '2026-08-30' }]} />);

    await user.click(screen.getAllByRole('button', { name: 'Abrir viaje' })[0]);
    fireEvent.change(screen.getByLabelText('Nueva fecha para Confirmar itinerario'), { target: { value: '01/09/2026' } });
    await user.click(screen.getByRole('button', { name: 'Completar Confirmar itinerario' }));

    expect(onOpenTrip).toHaveBeenCalledWith('trip-current');
    expect(onRescheduleTask).toHaveBeenCalledWith('task-1', '2026-09-01');
    expect(onCompleteTask).toHaveBeenCalledWith('task-1');
  });

  it('renders dashboard labels in English while keeping task values unchanged', () => {
    render(<LocaleProvider locale="en"><Dashboard today="2026-08-26" leads={[]} commissions={[]} tasks={[{ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} trips={[]} /></LocaleProvider>);

    expect(screen.getByRole('region', { name: 'Operational dashboard' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Travellers in progress' })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Priority attention' })).toBeTruthy();
    expect(screen.getByText('Overdue: 25/08/2026')).toBeTruthy();
    expect(screen.getByText('Confirmar itinerario')).toBeTruthy();
  });
});
