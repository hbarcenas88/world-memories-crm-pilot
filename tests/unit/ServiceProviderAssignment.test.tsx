import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ServiceProviderAssignment } from '../../src/features/trips/ServiceProviderAssignment';

afterEach(cleanup);

describe('ServiceProviderAssignment', () => {
  it('requires an explicit allowed currency and captures sale amount plus balance due date', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [] });
    const onCreateSuggestedTasks = vi.fn().mockResolvedValue(undefined);
    render(<ServiceProviderAssignment
      onAssign={onAssign}
      onCreateSuggestedTasks={onCreateSuggestedTasks}
      onReactivateProvider={vi.fn().mockResolvedValue(undefined)}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD', 'MXN'], createdAt: '2026-08-26T12:00:00.000Z' }]}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'MXN');
    await user.type(screen.getByLabelText('Importe de venta'), '1250');
    await user.type(screen.getByLabelText('Localizador de reserva'), 'WM-12345');
    await user.click(screen.getByLabelText('Fecha límite de saldo'));
    await user.type(screen.getByLabelText('Fecha límite de saldo'), '30/12/2026');
    await user.click(screen.getByRole('button', { name: 'Agregar Proveedor al Servicio' }));

    expect(onAssign).toHaveBeenCalledWith({ serviceId: 'service-1', providerId: 'provider-1', currency: 'MXN', amount: 1250, reservationLocator: 'WM-12345', customerBalanceDueOn: '2026-12-30', commissionStatus: 'with_commission' });
  });

  it('makes the no-commission choice explicit before assigning a Provider component', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [] });
    render(<ServiceProviderAssignment onAssign={onAssign} onCreateSuggestedTasks={vi.fn()} onReactivateProvider={vi.fn()} providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]} services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]} />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'USD');
    await user.selectOptions(screen.getByLabelText('Comisión del componente'), 'without_commission');
    await user.click(screen.getByRole('button', { name: 'Agregar Proveedor al Servicio' }));

    expect(onAssign).toHaveBeenCalledWith(expect.objectContaining({ commissionStatus: 'without_commission' }));
  });

  it('lets the user edit and explicitly confirm suggested tasks after assigning a Provider', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [{ templateId: 'template-1', title: 'Confirmar habitación', required: true }] });
    const onCreateSuggestedTasks = vi.fn().mockResolvedValue(undefined);
    render(<ServiceProviderAssignment
      onAssign={onAssign}
      onCreateSuggestedTasks={onCreateSuggestedTasks}
      onReactivateProvider={vi.fn().mockResolvedValue(undefined)}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Agregar Proveedor al Servicio' }));
    await user.clear(screen.getByLabelText('Tarea sugerida 1'));
    await user.type(screen.getByLabelText('Tarea sugerida 1'), 'Confirmar categoría de habitación');
    await user.click(screen.getByRole('button', { name: 'Crear tareas seleccionadas' }));

    expect(onCreateSuggestedTasks).toHaveBeenCalledWith('component-1', [{ templateId: 'template-1', title: 'Confirmar categoría de habitación', required: true }]);
  });

  it('requires the explicit Activar y usar action before assigning an inactive Provider', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [] });
    const onReactivateProvider = vi.fn().mockResolvedValue(undefined);
    render(<ServiceProviderAssignment
      onAssign={onAssign}
      onCreateSuggestedTasks={vi.fn().mockResolvedValue(undefined)}
      onReactivateProvider={onReactivateProvider}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'inactive', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Activar y usar' }));

    expect(onReactivateProvider).toHaveBeenCalledWith('provider-1');
    expect(onAssign).toHaveBeenCalledWith(expect.objectContaining({ providerId: 'provider-1', currency: 'USD' }));
  });

  it('lets the user discard even a required template before any task is created', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [{ templateId: 'template-1', title: 'Confirmar habitación', required: true }] });
    const onCreateSuggestedTasks = vi.fn().mockResolvedValue(undefined);
    render(<ServiceProviderAssignment onAssign={onAssign} onCreateSuggestedTasks={onCreateSuggestedTasks} onReactivateProvider={vi.fn().mockResolvedValue(undefined)} providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]} services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]} />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Agregar Proveedor al Servicio' }));
    await user.click(screen.getByLabelText('Incluir tarea sugerida 1'));
    await user.click(screen.getByRole('button', { name: 'Crear tareas seleccionadas' }));

    expect(onCreateSuggestedTasks).toHaveBeenCalledWith('component-1', []);
  });

  it('renders provider assignment controls in English without translating service or provider names', () => {
    render(<LocaleProvider locale="en"><ServiceProviderAssignment
      onAssign={vi.fn().mockResolvedValue({ serviceProvider: { id: 'component-1' }, suggestedTasks: [] })}
      onCreateSuggestedTasks={vi.fn().mockResolvedValue(undefined)}
      onReactivateProvider={vi.fn().mockResolvedValue(undefined)}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    /></LocaleProvider>);

    expect(screen.getByRole('region', { name: 'Assign Provider to Service' })).toBeTruthy();
    expect(screen.getByLabelText('Service for Provider')).toBeTruthy();
    expect(screen.getByLabelText('Provider for Service')).toBeTruthy();
    expect(screen.getByLabelText('Component currency')).toBeTruthy();
    expect(screen.getByLabelText('Sale amount')).toBeTruthy();
    expect(screen.getByLabelText('Customer balance due date')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Provider to Service' })).toBeTruthy();
  });

  it('keeps a failed assignment localized instead of showing a technical domain error', async () => {
    const user = userEvent.setup();
    render(<ServiceProviderAssignment
      onAssign={vi.fn().mockRejectedValue(new Error('provider does not allow selected currency'))}
      onCreateSuggestedTasks={vi.fn().mockResolvedValue(undefined)}
      onReactivateProvider={vi.fn().mockResolvedValue(undefined)}
      providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-26T12:00:00.000Z' }]}
      services={[{ id: 'service-1', tripId: 'trip-1', name: 'Hotel familiar', status: 'active', createdAt: '2026-08-26T12:00:00.000Z' }]}
    />);

    await user.selectOptions(screen.getByLabelText('Servicio para Proveedor'), 'service-1');
    await user.selectOptions(screen.getByLabelText('Proveedor para Servicio'), 'provider-1');
    await user.selectOptions(screen.getByLabelText('Moneda del componente'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Agregar Proveedor al Servicio' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No fue posible agregar el Proveedor.');
  });
});
