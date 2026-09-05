import { describe, expect, it } from 'vitest';
import { saveTripWorkspace } from '../../src/application/use-cases/saveTripWorkspace';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

const now = '2026-08-26T12:00:00.000Z';

describe('saveTripWorkspace', () => {
  it('rejects a trip participant who is not a member of the client family', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now, members: [{ id: 'member-1', name: 'Persona principal', birthDate: '1990-02-10', status: 'active' }] });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });

    await expect(saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente de prueba', createdAt: now, members: [{ id: 'member-1', name: 'Persona principal', birthDate: '1990-02-10', status: 'active' }] },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, primaryMemberId: 'member-1', travelerMemberIds: ['member-2'] },
      services: [], notes: [], occurredAt: now, recordedAt: now,
    })).rejects.toThrow('trip traveler is not a client member');
  });

  it('does not persist any client, trip, service or note when one service belongs to another trip', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });

    await expect(saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente editado', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now },
      services: [{ id: 'service-1', tripId: 'other-trip', name: 'Hotel', status: 'active', createdAt: now }],
      notes: [{ id: 'note-1', ownerType: 'trip', ownerId: 'trip-1', content: '<p>Nota</p>', updatedAt: now }],
      occurredAt: now,
      recordedAt: now,
    })).rejects.toThrow('service does not belong to trip');

    await expect(repository.getClient('client-1')).resolves.toMatchObject({ name: 'Cliente de prueba' });
    await expect(repository.listServicesForTrip('trip-1')).resolves.toEqual([]);
    await expect(repository.listNotesForOwner('trip', 'trip-1')).resolves.toEqual([]);
  });

  it('saves the entire workspace and derives the trip interval from dated services', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });

    const result = await saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente editado', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now },
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', startOn: '2026-12-10', endOn: '2026-12-15', createdAt: now }],
      notes: [{ id: 'note-1', ownerType: 'trip', ownerId: 'trip-1', content: '<p>Nota</p>', updatedAt: now }],
      occurredAt: now,
      recordedAt: now,
    });

    expect(result.trip).toMatchObject({ computedStartOn: '2026-12-10', computedEndOn: '2026-12-15', effectiveStartOn: '2026-12-10', effectiveEndOn: '2026-12-15', lastSavedAt: now });
    await expect(repository.listServicesForTrip('trip-1')).resolves.toHaveLength(1);
    await expect(repository.listNotesForOwner('trip', 'trip-1')).resolves.toHaveLength(1);
  });

  it('saves a provider-free additional concept only when it belongs to a service in the trip', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });

    await saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente de prueba', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now },
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: now }],
      serviceAdditionalItems: [{ id: 'item-1', serviceId: 'service-1', label: 'Seguro', amount: 80, currency: 'USD', createdAt: now }],
      notes: [], occurredAt: now, recordedAt: now,
    });

    await expect(repository.listServiceAdditionalItemsForService('service-1')).resolves.toEqual([expect.objectContaining({ label: 'Seguro', amount: 80, currency: 'USD' })]);
  });

  it('rejects an incomplete or self-referential exchange-rate reference before any write', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now });

    await expect(saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente editado', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'USD', referenceExchangeRate: 1 },
      services: [], notes: [], occurredAt: now, recordedAt: now,
    })).rejects.toThrow('trip reference currencies must differ');

    const unchangedTrip = await repository.getTrip('trip-1');
    expect(unchangedTrip).not.toHaveProperty('referenceExchangeRate');
  });

  it('requires an explicit confirmation for a sold-trip rate change, keeps its audit trail, and only propagates to linked commission projections', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now, referenceCurrency: 'USD', referenceRateBaseCurrency: 'USD', referenceRateQuoteCurrency: 'MXN', referenceExchangeRate: 18, referenceExchangeRateLockedAt: '2026-08-20T12:00:00.000Z' });
    await repository.seedProvider({ id: 'provider-1', name: 'Proveedor', status: 'active', allowedCurrencies: ['USD'], createdAt: now });
    await repository.seedCommission({ id: 'commission-following', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: now, projectionRateBaseCurrency: 'USD', projectionRateQuoteCurrency: 'MXN', projectionExchangeRate: 18, projectionRateSource: 'trip_reference', projectedReferenceAmount: { amount: 1800, currency: 'MXN' } });
    await repository.seedCommission({ id: 'commission-overridden', tripId: 'trip-1', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: now, projectionRateBaseCurrency: 'USD', projectionRateQuoteCurrency: 'MXN', projectionExchangeRate: 19, projectionRateSource: 'commission_override', projectedReferenceAmount: { amount: 1900, currency: 'MXN' } });

    const command = {
      client: { id: 'client-1', name: 'Cliente de prueba', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active' as const, createdAt: now, referenceCurrency: 'USD' as const, referenceRateBaseCurrency: 'USD' as const, referenceRateQuoteCurrency: 'MXN' as const, referenceExchangeRate: 18.5, referenceExchangeRateLockedAt: '2026-08-20T12:00:00.000Z' },
      services: [], notes: [], occurredAt: now, recordedAt: now,
    };

    await expect(saveTripWorkspace(repository, command)).rejects.toThrow('trip reference rate changes require explicit confirmation');
    await saveTripWorkspace(repository, { ...command, referenceRateChangeConfirmed: true, referenceRateChangeReason: 'Ajuste de cotización' });

    await expect(repository.getTrip('trip-1')).resolves.toMatchObject({ referenceExchangeRate: 18.5, referenceExchangeRateLockedAt: '2026-08-20T12:00:00.000Z' });
    await expect(repository.getCommission('commission-following')).resolves.toMatchObject({ projectionExchangeRate: 18.5, projectionRateSource: 'trip_reference', projectedReferenceAmount: { amount: 1850, currency: 'MXN' } });
    await expect(repository.getCommission('commission-overridden')).resolves.toMatchObject({ projectionExchangeRate: 19, projectionRateSource: 'commission_override', projectedReferenceAmount: { amount: 1900, currency: 'MXN' } });
    await expect(repository.listEventsForAggregate('trip-1')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'trip_reference_rate_changed', payload: expect.objectContaining({ previousRate: 18, nextRate: 18.5, reason: 'Ajuste de cotización' }) }),
    ]));
  });

  it('recalculates an open Provider-template task when the effective trip start changes', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-10', createdAt: now });
    await repository.seedTask({ id: 'task-1', title: 'Confirmar habitaci\u00f3n', required: true, tripId: 'trip-1', dueOn: '2026-09-08', status: 'open', source: 'provider_template', dueDateSource: 'template', templateSnapshot: { title: 'Confirmar habitaci\u00f3n', required: true, relativeTo: 'trip_start', offsetDays: -2 }, createdAt: now });

    await saveTripWorkspace(repository, {
      client: { id: 'client-1', name: 'Cliente de prueba', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: now },
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', startOn: '2026-09-15', endOn: '2026-09-20', createdAt: now }],
      notes: [],
      occurredAt: now,
      recordedAt: now,
    });

    await expect(repository.getTask('task-1')).resolves.toMatchObject({ dueOn: '2026-09-13', dueDateSource: 'template', requiresManualDateReview: false });
    await expect(repository.listEventsForAggregate('task-1')).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'task_template_date_recalculated', payload: { previousDueOn: '2026-09-08', dueOn: '2026-09-13' } })]));
  });

  it('preserves a manually adjusted template date and asks for review only once', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-1', name: 'Cliente de prueba', status: 'sold', clientId: 'client-1', tripId: 'trip-1', createdAt: now, acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' });
    await repository.seedClient({ id: 'client-1', name: 'Cliente de prueba', createdAt: now });
    await repository.seedTrip({ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-10', createdAt: now });
    await repository.seedTask({ id: 'task-1', title: 'Confirmar habitaci\u00f3n', required: true, tripId: 'trip-1', dueOn: '2026-09-09', status: 'open', source: 'provider_template', dueDateSource: 'manual', templateSnapshot: { title: 'Confirmar habitaci\u00f3n', required: true, relativeTo: 'trip_start', offsetDays: -2 }, createdAt: now });

    const command = {
      client: { id: 'client-1', name: 'Cliente de prueba', createdAt: now },
      trip: { id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active' as const, createdAt: now },
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active' as const, startOn: '2026-09-15', endOn: '2026-09-20', createdAt: now }],
      notes: [],
      occurredAt: now,
      recordedAt: now,
    };

    await saveTripWorkspace(repository, command);
    await saveTripWorkspace(repository, command);

    await expect(repository.getTask('task-1')).resolves.toMatchObject({ dueOn: '2026-09-09', dueDateSource: 'manual', requiresManualDateReview: true });
    await expect(repository.listEventsForAggregate('task-1')).resolves.toEqual([]);
  });
});
