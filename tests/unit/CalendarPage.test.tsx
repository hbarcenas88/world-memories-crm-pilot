import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { CalendarPage } from '../../src/features/calendar/CalendarPage';

afterEach(cleanup);

describe('CalendarPage', () => {
  it('switches between month, week and agenda without offering an hourly daily view', async () => {
    const user = userEvent.setup();
    render(<CalendarPage clients={[{ id: 'client-1', name: 'Familia Gómez', createdAt: '2026-08-20T00:00:00.000Z' }]} commissions={[]} onOpenClient={vi.fn()} onOpenCommission={vi.fn()} onOpenTask={vi.fn()} onOpenTrip={vi.fn()} services={[]} serviceProviders={[]} tasks={[{ id: 'task-1', title: 'Confirmar pasajeros', required: true, dueOn: '2026-09-07', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} today="2026-09-01" trips={[]} />);

    expect(screen.getByRole('heading', { name: 'Septiembre de 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Vista mensual' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('button', { name: /diaria/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Vista semanal' }));
    expect(screen.getByRole('heading', { name: 'Semana del 01/09/2026 al 07/09/2026' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Planificación y agenda' }));
    expect(screen.getByRole('heading', { name: 'Planificación y agenda' })).toBeTruthy();
  });

  it('opens the contextual side panel with only relevant record routes after one click', async () => {
    const user = userEvent.setup();
    const onOpenTrip = vi.fn();
    const onOpenClient = vi.fn();
    render(<CalendarPage clients={[{ id: 'client-1', name: 'Familia Gómez', createdAt: '2026-08-20T00:00:00.000Z' }]} commissions={[]} onOpenClient={onOpenClient} onOpenCommission={vi.fn()} onOpenTask={vi.fn()} onOpenTrip={onOpenTrip} services={[]} serviceProviders={[]} tasks={[]} today="2026-09-01" trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-10', effectiveEndOn: '2026-09-16' }]} />);

    await user.click(screen.getAllByRole('button', { name: 'Viaje de Familia Gómez: 10/09/2026–16/09/2026' })[0]);

    expect(screen.getByRole('complementary', { name: 'Detalle del calendario' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir viaje' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir cliente' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Abrir comisión' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Abrir viaje' }));
    expect(onOpenTrip).toHaveBeenCalledWith('trip-1');
    await user.click(screen.getByRole('button', { name: 'Abrir cliente' }));
    expect(onOpenClient).toHaveBeenCalledWith('client-1');
  });

  it('translates Calendar controls and dates to English without translating an entered task title', async () => {
    const user = userEvent.setup();
    render(<LocaleProvider locale="en"><CalendarPage clients={[]} commissions={[]} onOpenClient={vi.fn()} onOpenCommission={vi.fn()} onOpenTask={vi.fn()} onOpenTrip={vi.fn()} services={[]} serviceProviders={[]} tasks={[{ id: 'task-en', title: 'Confirmar pasajeros', required: true, dueOn: '2026-09-07', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} today="2026-09-01" trips={[]} /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Month view' })).toBeTruthy();
    expect(screen.getByRole('grid', { name: 'Monthly calendar' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Week view' }));
    expect(screen.getByRole('heading', { name: 'Week of 01/09/2026 to 07/09/2026' })).toBeTruthy();
    expect(screen.getByText('Confirmar pasajeros')).toBeTruthy();
  });
});
