import { describe, expect, it } from 'vitest';
import { addProviderToService } from '../../src/application/use-cases/addProviderToService';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('addProviderToService', () => {
  it('allows a multimoneda provider only after selecting one of its permitted currencies', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'InterCruises', status: 'active', allowedCurrencies: ['USD', 'MXN'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Crucero', status: 'active', createdAt: now });

    const result = await addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'MXN', amount: 1250, occurredAt: now, recordedAt: now });

    expect(result.serviceProvider).toMatchObject({ serviceId: 'service-1', providerId: 'provider-1', currency: 'MXN', saleAmount: 1250 });
  });

  it('rejects an amount when the selected currency is not allowed by the Provider', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor USD', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });

    await expect(addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'MXN', amount: 1250, occurredAt: now, recordedAt: now }))
      .rejects.toThrow('provider does not allow selected currency');
  });

  it('rejects an amount without an explicitly selected currency', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor USD', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });

    await expect(addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: undefined as never, amount: 1250, occurredAt: now, recordedAt: now }))
      .rejects.toThrow('currency is required before amount');
  });

  it('requires explicit reactivation before an inactive Provider can be used', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor inactivo', status: 'inactive', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Auto', status: 'active', createdAt: now });

    await expect(addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', amount: 1250, occurredAt: now, recordedAt: now }))
      .rejects.toThrow('provider must be active before use');
  });

  it('suggests active Provider templates without creating tasks automatically', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Disney', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Paquete', status: 'active', createdAt: now });
    await repository.seedProviderTaskTemplate({ id: 'template-1', providerId: 'provider-1', title: 'Reservar experiencia', required: false, relativeTo: 'trip_start', offsetDays: -70, active: true, createdAt: now });

    const result = await addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', occurredAt: now, recordedAt: now });

    expect(result.suggestedTasks).toEqual([{ templateId: 'template-1', title: 'Reservar experiencia', required: false, templateSnapshot: { title: 'Reservar experiencia', required: false, relativeTo: 'trip_start', offsetDays: -70 } }]);
    await expect(repository.listTasksForLead('lead-1')).resolves.toEqual([]);
  });

  it('preserves an optional customer balance due date on the provider component', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });

    const result = await addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', amount: 1200, customerBalanceDueOn: '2026-12-30', occurredAt: now, recordedAt: now });

    expect(result.serviceProvider.customerBalanceDueOn).toBe('2026-12-30');
  });

  it('keeps an explicit without-commission component without generating a Commission', async () => {
    const repository = new MemoryWorkspaceRepository();
    await repository.seedClient({ id: 'client-1', name: 'Cliente', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });
    await repository.seedProvider({ id: 'provider-1', name: 'Hotel', status: 'active', allowedCurrencies: ['USD'], grossCommissionMode: 'fixed_percentage', defaultGrossRate: 0.12, createdAt: now });
    await repository.seedService({ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now });

    const result = await addProviderToService(repository, { serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', amount: 1200, commissionStatus: 'without_commission', occurredAt: now, recordedAt: now });

    expect(result.serviceProvider.commissionStatus).toBe('without_commission');
    await expect(repository.listCommissions()).resolves.toEqual([]);
  });
});
