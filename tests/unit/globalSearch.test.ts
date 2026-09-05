import { describe, expect, it } from 'vitest';
import { searchWorkspace } from '../../src/features/search/globalSearchModel';

describe('searchWorkspace', () => {
  it('matches normalized text across operational records including Trips', () => {
    const results = searchWorkspace('gomez', {
      clients: [{ id: 'client-1', name: 'Familia Gómez', createdAt: '2026-08-20T00:00:00.000Z' }],
      leads: [{ id: 'lead-1', name: 'Familia Gomez', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }],
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z', effectiveStartOn: '2026-09-03', effectiveEndOn: '2026-09-08' }],
      providers: [{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], references: ['GOMEZ-777'], createdAt: '2026-08-20T00:00:00.000Z' }],
      tasks: [{ id: 'task-1', title: 'Llamar a Gómez', required: false, status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }],
      commissions: [],
    });

    expect(results.map((result) => result.kind)).toEqual(['client', 'lead', 'trip', 'provider', 'task']);
  });

  it('finds a Trip from its note or provider reservation locator with result context', () => {
    const results = searchWorkspace('aventura 42', {
      clients: [{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-08-20T00:00:00.000Z' }],
      leads: [{ id: 'lead-1', name: 'Familia Rivera', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'sold', createdAt: '2026-08-20T00:00:00.000Z' }],
      trips: [{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
      providers: [], tasks: [], commissions: [],
      notes: [{ id: 'note-1', ownerType: 'trip', ownerId: 'trip-1', content: 'Aventura 42: confirmar traslados', updatedAt: '2026-08-20T00:00:00.000Z' }],
      services: [{ id: 'service-1', tripId: 'trip-1', name: 'Hotel', status: 'active', createdAt: '2026-08-20T00:00:00.000Z' }],
      serviceProviders: [{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'without_commission', reservationLocator: 'AVENTURA-42', createdAt: '2026-08-20T00:00:00.000Z' }],
    });

    expect(results).toEqual([{ id: 'trip-1', kind: 'trip', label: 'Viaje: Familia Rivera', context: 'Aventura 42: confirmar traslados' }]);
  });

  it('finds a Lead from its searchable commercial note without changing captured content', () => {
    const results = searchWorkspace('aniversario intimo', {
      clients: [],
      leads: [{ id: 'lead-1', name: 'Familia Rivera', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', commercialNote: 'Prefieren un aniversario íntimo en la playa.', createdAt: '2026-08-20T00:00:00.000Z' }],
      trips: [], providers: [], tasks: [], commissions: [],
    });

    expect(results).toEqual([{ id: 'lead-1', kind: 'lead', label: 'Familia Rivera', context: 'Prefieren un aniversario íntimo en la playa.' }]);
  });
});
