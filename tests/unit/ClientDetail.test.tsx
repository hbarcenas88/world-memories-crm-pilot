import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ClientDetail } from '../../src/features/clients/ClientDetail';

afterEach(cleanup);

describe('ClientDetail', () => {
  it('shows recorded contact details and leads linked to the family without creating duplicate profiles', () => {
    render(<ClientDetail client={{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-20T00:00:00.000Z', phone: '6000-0000', email: 'familia@example.test', residenceCountry: 'Panamá' }} events={[]} leads={[{ id: 'lead-1', name: 'Ana Rivera', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z', clientId: 'client-1' }]} onClose={vi.fn()} onOpenLead={vi.fn()} onOpenTrip={vi.fn()} trips={[]} />);

    expect(screen.getByText('Contacto').parentElement?.textContent).toContain('6000-0000');
    expect(screen.getByText('Contacto').parentElement?.textContent).toContain('familia@example.test');
    expect(screen.getByText('Ana Rivera')).toBeTruthy();
  });

  it('shows family history, linked trips and a read-only aggregated timeline', async () => {
    const user = userEvent.setup();
    const onOpenTrip = vi.fn();
    render(<ClientDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-26T12:00:00.000Z', members: [{ id: 'member-1', name: 'Lucía', birthDate: '2017-08-15', status: 'archived' }] }}
      events={[{ id: 'event-1', aggregateType: 'lead', aggregateId: 'lead-1', type: 'quote_sent', occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T12:00:00.000Z', payload: {} }, { id: 'event-2', aggregateType: 'trip', aggregateId: 'trip-1', type: 'customer_payment_recorded', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }]}
      onClose={vi.fn()}
      onOpenTrip={onOpenTrip}
      trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    />);

    expect(screen.getByText('Lucía')).toBeTruthy();
    expect(screen.getByText('15/08/2017')).toBeTruthy();
    expect(screen.getByText(/Edad actual:/)).toBeTruthy();
    expect(screen.getByText('Archivado')).toBeTruthy();
    expect(screen.getByText('Cotización enviada')).toBeTruthy();
    expect(screen.getByText('Pago del Cliente registrado')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Abrir viaje' }));
    expect(onOpenTrip).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-1' }));
  });

  it('offers opening the family record in a full workspace', async () => {
    const user = userEvent.setup();
    const onOpenWorkspace = vi.fn();
    render(<ClientDetail client={{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-26T12:00:00.000Z' }} events={[]} onClose={vi.fn()} onOpenTrip={vi.fn()} onOpenWorkspace={onOpenWorkspace} trips={[]} />);
    await user.click(screen.getByRole('button', { name: 'Abrir expediente completo' }));
    expect(onOpenWorkspace).toHaveBeenCalledOnce();
  });

  it('translates the workspace while preserving member and family names', () => {
    render(<LocaleProvider locale="en"><ClientDetail client={{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-26T12:00:00.000Z', members: [{ id: 'member-1', name: 'Lucía', status: 'archived' }] }} events={[]} onClose={vi.fn()} onOpenTrip={vi.fn()} trips={[]} /></LocaleProvider>);
    expect(screen.getByLabelText('Client workspace')).toBeTruthy();
    expect(screen.getByText('Members')).toBeTruthy();
    expect(screen.getByText('Lucía')).toBeTruthy();
    expect(screen.getByText('Archived')).toBeTruthy();
  });
});
