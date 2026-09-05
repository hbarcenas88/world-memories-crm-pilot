import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('application shell', () => {
  afterEach(() => { cleanup(); globalThis.history.replaceState(undefined, '', '/'); });

  it('exposes Spanish navigation, a language switcher, and an accessible primary action', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryWorkspaceRepository()} />);

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Leads' }));
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nuevo lead' })).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');

    expect(screen.getByRole('heading', { name: 'Leads' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New lead' })).toBeTruthy();
  });

  it('restores the selected interface language from local configuration after reopening the app', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    const first = render(<App repository={repository} />);
    await user.click(screen.getByRole('button', { name: 'Leads' }));
    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');
    await screen.findByRole('button', { name: 'New lead' });
    first.unmount();

    render(<App repository={repository} />);
    expect(await screen.findByRole('button', { name: 'New lead' })).toBeTruthy();
    await waitFor(async () => expect((await repository.getConfiguration()).locale).toBe('en'));
  });

  it('keeps compact navigation destinations named when their visible labels collapse to icons', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryWorkspaceRepository()} />);

    expect(screen.getByRole('button', { name: 'Inicio' }).getAttribute('aria-label')).toBe('Inicio');
    expect(screen.getByRole('button', { name: 'Inicio' }).getAttribute('title')).toBe('Inicio');
    expect(screen.getByRole('button', { name: 'Clientes y familias' }).getAttribute('aria-label')).toBe('Clientes y familias');

    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');

    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-label')).toBe('Home');
    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('title')).toBe('Home');
    expect(screen.getByRole('button', { name: 'Clients and families' }).getAttribute('aria-label')).toBe('Clients and families');
  });

  it('uses a hash URL for navigation and restores the addressed module', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryWorkspaceRepository()} />);

    await user.click(screen.getByRole('button', { name: 'Calendario' }));
    expect(globalThis.location.hash).toBe('#/calendar');
    expect(screen.getByRole('heading', { name: 'Calendario' })).toBeTruthy();
  });

  it('rehydrates the addressed Lead from a contextual hash after loading the workspace', async () => {
    globalThis.history.replaceState(undefined, '', '#/leads?record=lead-context');
    const repository = new MemoryWorkspaceRepository({ id: 'lead-context', name: 'Consulta contextual', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T00:00:00.000Z' });

    render(<App repository={repository} />);

    expect(await screen.findByRole('heading', { name: 'Consulta contextual' })).toBeTruthy();
  });

  it('uses the official World Memories logo in the persistent sidebar', () => {
    render(<App repository={new MemoryWorkspaceRepository()} />);

    expect(screen.getByRole('img', { name: 'World Memories Travel Agency' }).getAttribute('src')).toBe('./brand/world-memories-logo.svg');
  });

  it('opens the functional settings screen completely in English when selected', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryWorkspaceRepository()} />);

    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Global settings' })).toBeTruthy();
    expect(screen.getByText('Date: DD/MM/YYYY')).toBeTruthy();
  });

  it('opens a Lead in the focused workspace while preserving primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-focus', name: 'Consulta enfocada', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);
    await user.click(screen.getByRole('button', { name: 'Leads' }));

    await user.click(await screen.findByRole('button', { name: /Consulta enfocada/ }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo' }));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Lista de leads' })).toBeNull();
  });

  it('opens a Client in the focused workspace while preserving primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-focus', name: 'Familia Enfocada', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Clientes y familias' }));
    await user.click(await screen.findByRole('button', { name: /Familia Enfocada/ }));
    await user.click(screen.getByRole('button', { name: 'Abrir expediente completo' }));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Lista de clientes' })).toBeNull();
    expect(document.querySelector('.workbench.workspace-mode')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Abrir expediente completo' })).toBeNull();
  });

  it('opens a Trip in the focused workspace while preserving primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-trip-focus', name: 'Consulta de viaje', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-29T00:00:00.000Z', clientId: 'client-trip-focus', tripId: 'trip-focus' });
    await repository.seedClient({ id: 'client-trip-focus', name: 'Familia viajera', createdAt: '2026-08-29T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-focus', leadId: 'lead-trip-focus', clientId: 'client-trip-focus', status: 'active', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia viajera/ }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo' }));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Lista de viajes' })).toBeNull();
  });

  it('edits a Lead from its visible action menu and persists the correction', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-edit', name: 'Consulta inicial', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T00:00:00.000Z', destination: 'Orlando' });
    render(<App repository={repository} />);
    await user.click(screen.getByRole('button', { name: 'Leads' }));

    await user.click(await screen.findByRole('button', { name: /Consulta inicial/ }));
    await user.click(screen.getByRole('button', { name: 'Acciones del lead Consulta inicial' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Nombre o referencia'));
    await user.type(screen.getByLabelText('Nombre o referencia'), 'Consulta corregida');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    await waitFor(async () => expect((await repository.getLead('lead-edit'))?.name).toBe('Consulta corregida'));
  });

  it('places the selected Lead in a keyboard-resizable detail panel', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-panel', name: 'Consulta ajustable', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);
    await user.click(screen.getByRole('button', { name: 'Leads' }));

    await user.click(await screen.findByRole('button', { name: /Consulta ajustable/ }));
    expect(screen.getByRole('separator', { name: 'Ajustar ancho del panel de detalle' }).getAttribute('aria-valuenow')).toBe('420');
  });

  it('places the selected Client in the same keyboard-resizable detail panel', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-panel', name: 'Familia ajustable', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Clientes y familias' }));
    await user.click(await screen.findByRole('button', { name: /Familia ajustable/ }));
    expect(screen.getByRole('separator', { name: 'Ajustar ancho del panel de detalle' })).toBeTruthy();
  });

  it('edits a Client from its visible action menu and persists the correction', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-edit', name: 'Familia inicial', familyNote: 'Nota inicial', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Clientes y familias' }));
    await user.click(await screen.findByRole('button', { name: /Familia inicial/ }));
    await user.click(screen.getByRole('button', { name: 'Acciones del cliente Familia inicial' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Nota útil de familia'));
    await user.type(screen.getByLabelText('Nota útil de familia'), 'Nota corregida');
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }));

    await waitFor(async () => expect((await repository.getClient('client-edit'))?.familyNote).toBe('Nota corregida'));
  });

  it('offers a safe undo after archiving a Lead from the visible impact decision', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-archive', name: 'Consulta archivada', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);
    await user.click(screen.getByRole('button', { name: 'Leads' }));

    await user.click(await screen.findByRole('button', { name: /Consulta archivada/ }));
    await user.click(screen.getByRole('button', { name: 'Acciones del lead Consulta archivada' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Lead archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.getLead('lead-archive'))?.archivedAt).toBeUndefined());
  });

  it('archives and restores a Provider through its visible lifecycle menu', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-archive', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Proveedores' }));
    await user.click(await screen.findByRole('button', { name: /Hotel Aurora/ }));
    await user.click(screen.getByRole('button', { name: 'Acciones del proveedor Hotel Aurora' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Proveedor archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.getProvider('provider-archive'))?.archivedAt).toBeUndefined());
  });

  it('opens a Provider in a full workspace and returns to its list', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-workspace', name: 'Hotel Espacio', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Proveedores' }));
    await user.click(await screen.findByRole('button', { name: /Hotel Espacio/ }));
    await user.click(screen.getByRole('button', { name: 'Abrir expediente completo' }));

    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.queryByLabelText('Lista de proveedores')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }));
    expect(await screen.findByLabelText('Lista de proveedores')).toBeTruthy();
  });

  it('archives and restores a saved Trip through its visible lifecycle menu', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-trip-archive', name: 'Consulta de viaje', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-29T00:00:00.000Z', clientId: 'client-trip-archive', tripId: 'trip-archive' });
    await repository.seedClient({ id: 'client-trip-archive', name: 'Familia viajera', createdAt: '2026-08-29T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-archive', leadId: 'lead-trip-archive', clientId: 'client-trip-archive', status: 'active', createdAt: '2026-08-29T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia viajera/ }));
    await user.click(await screen.findByRole('button', { name: 'Acciones del viaje Familia viajera' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Viaje archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.getTrip('trip-archive'))?.archivedAt).toBeUndefined());
  });

  it('opens the matching client workspace from the persistent global search', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-1', name: 'Familia Gómez', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en CRM' }), 'gomez');
    await user.click(screen.getByRole('button', { name: 'Familia Gómez' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Clientes y familias' })).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'Familia Gómez' })).toBeTruthy();
  });

  it('keeps a completed task undoable from the persistent workspace', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTask({ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Tareas' }));
    await user.click(await screen.findByRole('button', { name: 'Completar: Confirmar itinerario' }));
    await user.click(await screen.findByRole('button', { name: 'Deshacer: Confirmar itinerario' }));

    await waitFor(async () => expect((await repository.getTask('task-1'))?.status).toBe('open'));
  });

  it('opens a Task in a focused workspace while keeping primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTask({ id: 'task-workspace', title: 'Confirmar itinerario', required: false, dueOn: '2026-09-02', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Tareas' }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo: Confirmar itinerario' }));

    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Confirmar itinerario' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Tareas' })).toBeNull();
  });

  it('opens a Commission in a focused workspace while keeping primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-commission-workspace', name: 'Hotel Espacio', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-commission-workspace', leadId: 'lead-commission-workspace', clientId: 'client-commission-workspace', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedCommission({ id: 'commission-workspace', tripId: 'trip-commission-workspace', providerId: 'provider-commission-workspace', expected: { amount: 120, currency: 'USD' }, status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Comisiones' }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo: Hotel Espacio' }));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Hotel Espacio' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Tablero de comisiones' })).toBeNull();

    await user.type(screen.getByRole('textbox', { name: 'Tracking Form #' }), 'WM-120');
    await user.click(screen.getByRole('button', { name: 'Guardar tracking' }));
    await waitFor(async () => expect((await repository.snapshot()).commissions).toContainEqual(expect.objectContaining({ id: 'commission-workspace', trackingReference: 'WM-120' })));
  });

  it('opens a Service in a focused workspace from its Trip without losing primary navigation', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-service-workspace', name: 'Consulta de servicio', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-20T00:00:00.000Z', clientId: 'client-service-workspace', tripId: 'trip-service-workspace' });
    await repository.seedClient({ id: 'client-service-workspace', name: 'Familia servicio', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-service-workspace', leadId: 'lead-service-workspace', clientId: 'client-service-workspace', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedService({ id: 'service-workspace', tripId: 'trip-service-workspace', name: 'Hotel enfocado', status: 'active', startOn: '2026-10-02', endOn: '2026-10-06', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia servicio/ }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo: Hotel enfocado' }));

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Hotel enfocado' })).toBeTruthy();
    expect(screen.queryByRole('complementary', { name: 'Expediente de viaje' })).toBeNull();

    await user.clear(screen.getByRole('textbox', { name: 'Nombre del servicio' }));
    await user.type(screen.getByRole('textbox', { name: 'Nombre del servicio' }), 'Hotel corregido');
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }));
    await waitFor(async () => expect((await repository.snapshot()).services).toContainEqual(expect.objectContaining({ id: 'service-workspace', name: 'Hotel corregido' })));
  });

  it('opens and corrects a Payment in a focused workspace from its Trip', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository({ id: 'lead-payment-workspace', name: 'Consulta de pago', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-20T00:00:00.000Z', clientId: 'client-payment-workspace', tripId: 'trip-payment-workspace' });
    await repository.seedClient({ id: 'client-payment-workspace', name: 'Familia pago', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-payment-workspace', leadId: 'lead-payment-workspace', clientId: 'client-payment-workspace', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedService({ id: 'service-payment-workspace', tripId: 'trip-payment-workspace', name: 'Hotel pago', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-payment-workspace', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-payment-workspace', serviceId: 'service-payment-workspace', providerId: 'provider-payment-workspace', currency: 'USD', saleAmount: 900, commissionStatus: 'with_commission', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedPayment({ id: 'payment-workspace', tripId: 'trip-payment-workspace', serviceProviderId: 'component-payment-workspace', amount: { amount: 200, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T00:00:00.000Z', status: 'received', source: 'customer_payment' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia pago/ }));
    await user.click(await screen.findByRole('button', { name: 'Abrir expediente completo: payment-workspace' }));

    expect(screen.getByRole('navigation', { name: 'Ruta del expediente' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pago payment-workspace' })).toBeTruthy();
    await user.clear(screen.getByRole('spinbutton', { name: 'Corrección de importe payment-workspace' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Corrección de importe payment-workspace' }), '225');
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-workspace' }));
    await waitFor(async () => expect((await repository.snapshot()).payments).toContainEqual(expect.objectContaining({ id: 'payment-workspace', amount: { amount: 225, currency: 'USD' } })));
  });

  it('archives and restores a Task through the visible lifecycle decision', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTask({ id: 'task-archive', title: 'Confirmar reserva', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Tareas' }));
    await user.click(await screen.findByRole('button', { name: 'Tarea: Confirmar reserva' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Tarea archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.getTask('task-archive'))?.archivedAt).toBeUndefined());
  });

  it('archives and restores a Commission through the visible lifecycle decision', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-commission', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-commission', leadId: 'lead-commission', clientId: 'client-commission', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedCommission({ id: 'commission-archive', tripId: 'trip-commission', providerId: 'provider-commission', expected: { amount: 120, currency: 'USD' }, status: 'expected', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Comisiones' }));
    await user.click(await screen.findByRole('button', { name: 'Acciones de la comisión Hotel Aurora' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Comisión archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.snapshot()).commissions.find((commission) => commission.id === 'commission-archive')?.archivedAt).toBeUndefined());
  });

  it('corrects a customer payment from its Trip workspace with an auditable change', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-payment', name: 'Familia pagos', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-payment', leadId: 'lead-payment', clientId: 'client-payment', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedService({ id: 'service-payment', tripId: 'trip-payment', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-payment', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-payment', serviceId: 'service-payment', providerId: 'provider-payment', currency: 'USD', saleAmount: 900, commissionStatus: 'with_commission', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedPayment({ id: 'payment-correct', tripId: 'trip-payment', serviceProviderId: 'component-payment', amount: { amount: 200, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T00:00:00.000Z', status: 'received', source: 'customer_payment' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia pagos/ }));
    await user.click(await screen.findByRole('button', { name: 'Editar pago: payment-correct' }));
    await user.clear(screen.getByLabelText('Corrección de importe payment-correct'));
    await user.type(screen.getByLabelText('Corrección de importe payment-correct'), '225');
    fireEvent.change(screen.getByLabelText('Corrección de fecha payment-correct'), { target: { value: '21/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar corrección de payment-correct' }));

    await waitFor(async () => expect((await repository.snapshot()).payments).toContainEqual(expect.objectContaining({ id: 'payment-correct', amount: { amount: 225, currency: 'USD' }, occurredAt: '2026-08-21T12:00:00.000Z' })));
    expect((await repository.snapshot()).events).toContainEqual(expect.objectContaining({ aggregateType: 'payment', aggregateId: 'payment-correct', type: 'customer_payment_corrected' }));
  });

  it('archives and restores a Service from its saved Trip workspace', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-service', name: 'Familia servicios', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-service', leadId: 'lead-service', clientId: 'client-service', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedService({ id: 'service-archive', tripId: 'trip-service', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia servicios/ }));
    await user.click(await screen.findByRole('button', { name: 'Acciones del servicio Hotel familiar' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Servicio archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.snapshot()).services.find((service) => service.id === 'service-archive')?.archivedAt).toBeUndefined());
  });

  it('archives and restores a Payment from its saved Trip workspace', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-payment-archive', name: 'Familia pagos archivo', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedTrip({ id: 'trip-payment-archive', leadId: 'lead-payment-archive', clientId: 'client-payment-archive', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedService({ id: 'service-payment-archive', tripId: 'trip-payment-archive', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-payment-archive', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedServiceProvider({ id: 'component-payment-archive', serviceId: 'service-payment-archive', providerId: 'provider-payment-archive', currency: 'USD', saleAmount: 900, commissionStatus: 'with_commission', createdAt: '2026-08-20T00:00:00.000Z' });
    await repository.seedPayment({ id: 'payment-archive', tripId: 'trip-payment-archive', serviceProviderId: 'component-payment-archive', amount: { amount: 200, currency: 'USD' }, occurredAt: '2026-08-20T12:00:00.000Z', recordedAt: '2026-08-20T00:00:00.000Z', status: 'received', source: 'customer_payment' });
    render(<App repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Viajes' }));
    await user.click(await screen.findByRole('button', { name: /Familia pagos archivo/ }));
    await user.click(await screen.findByRole('button', { name: 'Acciones del pago payment-archive' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Pago archivado');
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect((await repository.snapshot()).payments.find((payment) => payment.id === 'payment-archive')?.archivedAt).toBeUndefined());
  });

  it('surfaces persisted overdue work in the notification center', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    await repository.seedTask({ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' });
    render(<App repository={repository} />);

    await user.click(await screen.findByRole('button', { name: 'Notificaciones (1)' }));

    expect(screen.getByText('Tarea vencida: Confirmar itinerario')).toBeTruthy();
  });
});
