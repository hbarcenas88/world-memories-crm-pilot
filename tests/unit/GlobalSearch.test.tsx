import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GlobalSearch } from '../../src/features/search/GlobalSearch';

describe('GlobalSearch', () => {
  it('groups normalized matches by record type and opens the selected context', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GlobalSearch clients={[{ id: 'client-1', name: 'Familia Gómez', createdAt: '2026-08-20T00:00:00.000Z' }]} commissions={[]} leads={[{ id: 'lead-1', name: 'GOMEZ', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }]} onSelect={onSelect} providers={[]} tasks={[{ id: 'task-1', title: 'Llamar a Gómez', required: false, status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-03', effectiveEndOn: '2026-09-08' }]} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en CRM' }), 'gomez');

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Viajes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tareas' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Familia Gómez' }));

    expect(onSelect).toHaveBeenCalledWith({ id: 'client-1', kind: 'client', label: 'Familia Gómez' });
  });
});
