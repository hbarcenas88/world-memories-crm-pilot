import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { TripDetail } from '../../src/features/trips/TripDetail';

vi.mock('@tiptap/react', async () => {
  const React = await import('react');
  type EditorOptions = { content?: string; onUpdate?: (context: { editor: { getHTML: () => string } }) => void };
  type Editor = { options: EditorOptions; commands: { setContent: () => void } };
  return {
    useEditor: (options: EditorOptions): Editor => React.useState(() => ({ options, commands: { setContent: () => undefined } }))[0],
    EditorContent: ({ editor }: { editor: Editor }) => {
      const [value, setValue] = React.useState(editor.options.content ?? '');
      return <textarea aria-label="Nota de trabajo" onChange={(event) => {
        setValue(event.target.value);
        editor.options.onUpdate?.({ editor: { getHTML: () => event.target.value } });
      }} value={value} />;
    },
  };
});

const now = '2026-08-26T12:00:00.000Z';

afterEach(cleanup);

describe('TripDetail', () => {
  it('keeps client, trip and work note in one draft until Guardar cambios', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      onClose={onClose}
      onSave={onSave}
    />);

    await user.clear(screen.getByLabelText('Nota útil de familia'));
    await user.type(screen.getByLabelText('Nota útil de familia'), 'Prefieren hoteles familiares');
    fireEvent.change(screen.getByLabelText('Inicio manual del viaje'), { target: { value: '10/12/2026' } });
    fireEvent.change(screen.getByLabelText('Fin manual del viaje'), { target: { value: '15/12/2026' } });
    await user.type(screen.getByLabelText('Nota de trabajo'), 'Confirmar traslados y seguro.');

    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      client: expect.objectContaining({ familyNote: 'Prefieren hoteles familiares' }),
      trip: expect.objectContaining({ overrideStartOn: '2026-12-10', overrideEndOn: '2026-12-15' }),
      notes: [expect.objectContaining({ ownerType: 'trip', content: expect.stringContaining('Confirmar traslados y seguro.') })],
    }));
    await user.click(screen.getByRole('button', { name: 'Cerrar expediente' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('warns before discarding an unsaved workspace', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      onClose={onClose}
      onSave={vi.fn()}
    />);

    await user.type(screen.getByLabelText('Nota útil de familia'), 'Viajan con niños');
    await user.click(screen.getByRole('button', { name: 'Cerrar expediente' }));

    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salir sin guardar' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('adds a service to the shared workspace draft before its single save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.type(screen.getByLabelText('Nombre del servicio'), 'Hotel familiar');
    fireEvent.change(screen.getByLabelText('Inicio del servicio'), { target: { value: '10/12/2026' } });
    fireEvent.change(screen.getByLabelText('Fin del servicio'), { target: { value: '15/12/2026' } });
    await user.click(screen.getByRole('button', { name: 'Añadir servicio' }));

    expect(screen.getByRole('button', { name: 'Editar servicio: Hotel familiar' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      services: [expect.objectContaining({ name: 'Hotel familiar', startOn: '2026-12-10', endOn: '2026-12-15' })],
    }));
  });

  it('adds a provider-free additional concept to the same Service workspace draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: now }]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.selectOptions(screen.getByLabelText('Servicio del concepto'), 'service-1');
    await user.type(screen.getByLabelText('Concepto'), 'Seguro');
    await user.type(screen.getByLabelText('Importe del concepto'), '80');
    await user.selectOptions(screen.getByLabelText('Moneda Conceptos adicionales'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Agregar concepto adicional' }));
    expect(screen.getByText('Seguro')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ serviceAdditionalItems: [expect.objectContaining({ serviceId: 'service-1', label: 'Seguro', amount: 80, currency: 'USD' })] }));
  });

  it('edits an existing additional concept inside the same Service workspace draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: now }]}
      serviceAdditionalItems={[{ id: 'item-1', serviceId: 'service-1', label: 'Seguro', amount: 80, currency: 'USD', createdAt: now }]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.click(screen.getByRole('button', { name: 'Editar concepto adicional: Seguro' }));
    await user.clear(screen.getByLabelText('Importe del concepto'));
    await user.type(screen.getByLabelText('Importe del concepto'), '95');
    await user.click(screen.getByRole('button', { name: 'Guardar concepto adicional' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ serviceAdditionalItems: [expect.objectContaining({ id: 'item-1', amount: 95 })] }));
  });

  it('keeps an explicit reference currency and exchange rate in the single Trip save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.selectOptions(screen.getByLabelText('Moneda base de referencia'), 'USD');
    await user.selectOptions(screen.getByLabelText('Moneda cotizada de referencia'), 'MXN');
    await user.type(screen.getByLabelText('Tasa de cambio de referencia'), '18.45');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      trip: expect.objectContaining({ referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18.45 }),
    }));
  });

  it('asks for an explicit confirmation and optional reason before saving a post-sale rate adjustment', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18, referenceExchangeRateLockedAt: now }}
      services={[]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.clear(screen.getByLabelText('Tasa de cambio de referencia'));
    await user.type(screen.getByLabelText('Tasa de cambio de referencia'), '18.5');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveProperty('disabled', true);
    await user.click(screen.getByLabelText('Confirmo el ajuste de tasa de referencia'));
    await user.type(screen.getByLabelText('Motivo del ajuste de tasa'), 'Cotización actualizada');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      referenceRateChangeConfirmed: true,
      referenceRateChangeReason: 'Cotización actualizada',
    }));
  });

  it('shows reservation locators and rolls known service amounts into totals by currency', () => {
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: now }]}
      serviceAdditionalItems={[{ id: 'item-1', serviceId: 'service-1', label: 'Seguro', amount: 80, currency: 'USD', createdAt: now }]}
      paymentComponents={[{ id: 'component-1', serviceName: 'Hotel familiar', providerName: 'Proveedor Uno', currency: 'USD', saleAmount: 1200, reservationLocator: 'WM-12345' }]}
      notes={[]}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />);

    expect(screen.getByText('Localizador de reserva: WM-12345')).toBeTruthy();
    expect(screen.getByText('1,280.00')).toBeTruthy();
  });

  it('edits an existing service inside the same workspace draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel inicial', status: 'active', startOn: '2026-12-10', endOn: '2026-12-15', createdAt: now }]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    await user.click(screen.getByRole('button', { name: 'Editar servicio: Hotel inicial' }));
    await user.clear(screen.getByLabelText('Nombre del servicio'));
    await user.type(screen.getByLabelText('Nombre del servicio'), 'Hotel corregido');
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      services: [expect.objectContaining({ id: 'service-1', name: 'Hotel corregido', startOn: '2026-12-10', endOn: '2026-12-15' })],
    }));
  });

  it('projects a traveler age at the trip start and keeps archival as explicit historical state', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now, members: [{ id: 'member-1', name: 'Lucía', birthDate: '2015-12-20', relationship: 'Hija', status: 'active' }] }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, effectiveStartOn: '2026-12-10', primaryMemberId: 'member-1', travelerMemberIds: ['member-1'] }}
      services={[]}
      notes={[]}
      onClose={vi.fn()}
      onSave={onSave}
    />);

    expect(screen.getByText('Edad al inicio: 10 años, 11 meses')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Archivar miembro: Lucía' }));
    expect(screen.getByText('Archivado')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({
      client: expect.objectContaining({ members: [expect.objectContaining({ id: 'member-1', status: 'archived' })] }),
    }));
    await user.click(screen.getByRole('button', { name: 'Reactivar miembro: Lucía' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({
      client: expect.objectContaining({ members: [expect.objectContaining({ id: 'member-1', status: 'active' })] }),
    }));
  });

  it('shows the Trip tasks alongside its work note without making them part of the unsaved draft', () => {
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      onClose={vi.fn()}
      onSave={vi.fn()}
      tasks={[{ id: 'task-1', title: 'Confirmar traslados', required: false, dueOn: '2026-09-15', status: 'open', tripId: 'trip-1', source: 'manual', createdAt: now }]}
    />);

    expect(screen.getByRole('heading', { name: 'Tareas del viaje' })).toBeTruthy();
    expect(screen.getByText('Confirmar traslados')).toBeTruthy();
    expect(screen.getByText('15/09/2026')).toBeTruthy();
  });

  it('shows a combined, operational history without adding events to the editable draft', () => {
    render(<TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now }}
      services={[]}
      notes={[]}
      events={[{ id: 'event-1', aggregateType: 'trip', aggregateId: 'trip-1', type: 'payment_recorded', occurredAt: '2026-09-15T14:30:00.000Z', recordedAt: '2026-09-15T14:30:00.000Z', payload: {} }]}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: 'Historial agregado' })).toBeTruthy();
    expect(screen.getByText('payment recorded')).toBeTruthy();
    expect(screen.getByText('15/09/2026 09:30')).toBeTruthy();
  });

  it('renders the trip workspace controls and unsaved-changes dialog in English without translating captured data', async () => {
    const user = userEvent.setup();
    render(<LocaleProvider locale="en"><TripDetail
      client={{ id: 'client-1', name: 'Familia Rivera', createdAt: now, members: [{ id: 'member-1', name: 'Lucía', birthDate: '2015-12-20', status: 'active' }] }}
      trip={{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, effectiveStartOn: '2026-12-10', primaryMemberId: 'member-1', travelerMemberIds: ['member-1'] }}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: now }]}
      notes={[]}
      onClose={vi.fn()}
      onSave={vi.fn()}
    /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'Members and travellers' })).toBeTruthy();
    expect(screen.getByText('Current age: 10 years, 8 months')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archive member: Lucía' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit service: Hotel familiar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.queryByText('Archivar miembro: Lucía')).toBeNull();
    await user.type(screen.getByLabelText('Useful family note'), 'No translation');
    await user.click(screen.getByRole('button', { name: 'Close workspace' }));
    expect(screen.getByRole('dialog', { name: 'Unsaved changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
