import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { TripList } from '../../src/features/trips/TripList';

afterEach(cleanup);

describe('TripList', () => {
  it('keeps archived trips accessible through the archive filter', async () => {
    const user = userEvent.setup();
    render(<TripList clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-29T00:00:00.000Z' }]} onSelect={vi.fn()} trips={[
      { id: 'active', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-29T00:00:00.000Z' },
      { id: 'archived', leadId: 'lead-2', clientId: 'client-1', status: 'completed', createdAt: '2026-08-29T00:00:00.000Z', archivedAt: '2026-08-29T01:00:00.000Z' },
    ]} />);

    const tripList = screen.getByLabelText('Lista de viajes');
    expect(within(tripList).getAllByText('Familia Rivera')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(within(tripList).getAllByText('Familia Rivera')).toHaveLength(1);
    expect(screen.getByText('Archivado')).toBeTruthy();
  });

  it('translates list headings without translating the linked client name', () => {
    render(<LocaleProvider locale="en"><TripList clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-29T00:00:00.000Z' }]} onSelect={vi.fn()} trips={[{ id: 'active', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-29T00:00:00.000Z' }]} /></LocaleProvider>);
    expect(screen.getByLabelText('Trip list')).toBeTruthy();
    expect(screen.getByText('Effective period')).toBeTruthy();
    expect(within(screen.getByLabelText('Trip list')).getByText('Familia Rivera')).toBeTruthy();
    expect(within(screen.getByLabelText('Trip list')).getByText('Active trip')).toBeTruthy();
    expect(screen.queryByText('active')).toBeNull();
  });

  it('filters active trips independently by status, client, and effective date interval', async () => {
    const user = userEvent.setup();
    render(<TripList clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-29T00:00:00.000Z' }, { id: 'client-2', name: 'Familia Gómez', createdAt: '2026-08-29T00:00:00.000Z' }]} onSelect={vi.fn()} trips={[
      { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-29T00:00:00.000Z', effectiveStartOn: '2026-09-10', effectiveEndOn: '2026-09-15' },
      { id: 'trip-2', leadId: 'lead-2', clientId: 'client-2', status: 'completed', createdAt: '2026-08-29T00:00:00.000Z', effectiveStartOn: '2026-08-10', effectiveEndOn: '2026-08-15' },
    ]} />);

    await user.selectOptions(screen.getByLabelText('Estado de viaje'), 'completed');
    const tripList = screen.getByLabelText('Lista de viajes');
    expect(within(tripList).getByText('Familia Gómez')).toBeTruthy();
    expect(within(tripList).queryByText('Familia Rivera')).toBeNull();
    await user.selectOptions(screen.getByLabelText('Cliente de viaje'), 'client-1');
    expect(screen.getByText('No hay registros en este filtro')).toBeTruthy();
  });
});
