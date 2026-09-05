import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ProviderList } from '../../src/features/providers/ProviderList';

afterEach(cleanup);

describe('ProviderList', () => {
  it('keeps archived providers accessible through the archive filter', async () => {
    const user = userEvent.setup();
    render(<ProviderList onSelect={vi.fn()} providers={[
      { id: 'active', name: 'Hotel activo', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-29T00:00:00.000Z' },
      { id: 'archived', name: 'Hotel archivado', status: 'inactive', allowedCurrencies: ['USD'], createdAt: '2026-08-29T00:00:00.000Z', archivedAt: '2026-08-29T01:00:00.000Z' },
    ]} />);

    expect(screen.getByText('Hotel activo')).toBeTruthy();
    expect(screen.queryByText('Hotel archivado')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(screen.getByText('Hotel archivado')).toBeTruthy();
    expect(screen.getByText('Archivado')).toBeTruthy();
  });

  it('translates provider list headings and statuses into English', () => {
    render(<LocaleProvider locale="en"><ProviderList onSelect={vi.fn()} providers={[{ id: 'active', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-29T00:00:00.000Z' }]} /></LocaleProvider>);

    expect(screen.getByLabelText('Provider list')).toBeTruthy();
    expect(screen.getByText('Allowed currencies')).toBeTruthy();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Hotel Aurora')).toBeTruthy();
  });

  it('filters providers by service type and a name search without hiding archived records controls', async () => {
    const user = userEvent.setup();
    render(<ProviderList onSelect={vi.fn()} providers={[
      { id: 'hotel', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], serviceTypes: ['Hoteles'], createdAt: '2026-08-29T00:00:00.000Z' },
      { id: 'tour', name: 'Aventura Viva', status: 'active', allowedCurrencies: ['USD'], serviceTypes: ['Actividades o tours'], createdAt: '2026-08-29T00:00:00.000Z' },
    ]} />);

    await user.selectOptions(screen.getByLabelText('Tipo de servicio'), 'Hoteles');
    expect(screen.getByText('Hotel Aurora')).toBeTruthy();
    expect(screen.queryByText('Aventura Viva')).toBeNull();
    await user.clear(screen.getByLabelText('Buscar proveedores'));
    await user.type(screen.getByLabelText('Buscar proveedores'), 'no coincide');
    expect(screen.getByText('No hay proveedores en este filtro')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archivados' })).toBeTruthy();
  });
});
