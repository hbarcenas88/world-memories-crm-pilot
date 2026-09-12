import type { Page } from '@playwright/test';

const at = '2026-09-07T12:00:00.000Z';

const configuration = {
  id: 'workspace-configuration', locale: 'es', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: '1,234.56', updatedAt: at,
  catalogs: {
    travelTypes: [{ id: 'type-custom', label: 'Viaje personalizado', active: true }],
    acquisitionSources: [{ id: 'source-web', label: 'Web', active: true }],
    communicationChannels: [], cancellationReasons: [],
    familyRelationships: [{ id: 'relationship-parent', label: 'Madre', active: true }],
  },
};

const stores = {
  leads: [
    { id: 'lead-long', name: 'Familia Calderón de la Fuente con itinerario especial', acquisitionSource: 'Web', requestedDateStatus: 'dates_known', requestedStartOn: '2026-09-18', requestedEndOn: '2026-09-25', status: 'follow_up', createdAt: at, clientId: 'client-long', tripId: 'trip-active' },
    { id: 'lead-archived', name: 'Consulta archivada de prueba', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'paused', createdAt: at, archivedAt: at },
  ],
  clients: [
    { id: 'client-long', name: 'Familia Calderón de la Fuente con itinerario especial', familyNote: 'Nota sintética que no debe traducirse.', createdAt: at, lastSavedAt: at, members: [{ id: 'member-1', name: 'Andrea Calderón', relationship: 'Madre', status: 'active' }] },
    { id: 'client-historical', name: 'Cliente histórico de prueba', createdAt: at },
  ],
  trips: [
    { id: 'trip-active', leadId: 'lead-long', clientId: 'client-long', status: 'active', effectiveStartOn: '2026-09-18', effectiveEndOn: '2026-09-25', createdAt: at, lastSavedAt: at },
    { id: 'trip-completed', leadId: 'lead-long', clientId: 'client-historical', status: 'completed', effectiveStartOn: '2026-08-01', effectiveEndOn: '2026-08-05', createdAt: at },
  ],
  services: [
    { id: 'service-hotel', tripId: 'trip-active', name: 'Hotel sintético con nombre largo', status: 'active', startOn: '2026-09-18', endOn: '2026-09-25', createdAt: at },
    { id: 'service-flight', tripId: 'trip-active', name: 'Vuelo sintético', status: 'active', startOn: '2026-09-18', endOn: '2026-09-18', createdAt: at },
  ],
  serviceProviders: [
    { id: 'component-usd', serviceId: 'service-hotel', providerId: 'provider-active', currency: 'USD', saleAmount: 1000, reservationLocator: 'WM-SYNTH-001', customerBalanceDueOn: '2026-09-15', commissionStatus: 'with_commission', createdAt: at },
    { id: 'component-mxn', serviceId: 'service-flight', providerId: 'provider-inactive', currency: 'MXN', saleAmount: 5000, commissionStatus: 'without_commission', createdAt: at },
  ],
  serviceAdditionalItems: [{ id: 'additional-1', serviceId: 'service-hotel', label: 'Seguro sintético', amount: 50, currency: 'USD', createdAt: at }],
  providers: [
    { id: 'provider-active', name: 'Proveedor activo sintético', status: 'active', allowedCurrencies: ['USD'], createdAt: at },
    { id: 'provider-inactive', name: 'Proveedor inactivo sintético', status: 'inactive', allowedCurrencies: ['MXN'], createdAt: at },
    { id: 'provider-archived', name: 'Proveedor archivado sintético', status: 'active', allowedCurrencies: ['USD'], createdAt: at, archivedAt: at },
  ],
  providerTaskTemplates: [{ id: 'template-1', providerId: 'provider-active', title: 'Confirmar habitación', required: true, relativeTo: 'trip_start', offsetDays: -2, active: true, createdAt: at }],
  commissions: [
    { id: 'commission-expected', tripId: 'trip-active', providerId: 'provider-active', serviceProviderId: 'component-usd', expected: { amount: 100, currency: 'USD' }, dueOn: '2026-09-14', status: 'expected', createdAt: at },
    { id: 'commission-paid', tripId: 'trip-active', providerId: 'provider-active', expected: { amount: 50, currency: 'USD' }, received: { amount: 50, currency: 'USD' }, paidOn: '2026-09-01', status: 'paid', createdAt: at },
  ],
  notes: [{ id: 'note-lead-trip', ownerType: 'trip', ownerId: 'trip-active', content: 'Nota sintética buscable para la revisión visual.', updatedAt: at }],
  tasks: [
    { id: 'task-manual', title: 'Llamar a la familia de prueba', required: true, dueOn: '2026-09-07', dueTime: '14:30', status: 'open', tripId: 'trip-active', source: 'manual', createdAt: at },
    { id: 'task-template', title: 'Confirmar habitación', required: true, dueOn: '2026-09-16', status: 'open', tripId: 'trip-active', serviceProviderId: 'component-usd', source: 'provider_template', createdAt: at },
    { id: 'task-completed', title: 'Tarea completada sintética', required: false, dueOn: '2026-09-01', status: 'completed', completedAt: at, createdAt: at },
    { id: 'task-archived', title: 'Tarea archivada sintética', required: false, status: 'open', archivedAt: at, createdAt: at },
  ],
  payments: [
    { id: 'payment-partial', tripId: 'trip-active', serviceProviderId: 'component-usd', amount: { amount: 400, currency: 'USD' }, occurredAt: at, recordedAt: at, status: 'received', source: 'customer_payment' },
  ],
  activityEvents: Array.from({ length: 12 }, (_, index) => ({ id: `event-${index}`, aggregateType: 'lead', aggregateId: 'lead-long', type: index === 0 ? 'lead_received' : 'lead_follow_up', occurredAt: at, recordedAt: at, payload: {} })),
  backupDownloads: [],
  configurations: [configuration],
  deletedRecordReferences: [
    { key: 'client:client-deleted', kind: 'client', id: 'client-deleted', displayLabel: 'Familia eliminada sintética', deletedAt: at, eventDisposition: 'kept' },
    { key: 'task:task-deleted', kind: 'task', id: 'task-deleted', displayLabel: 'Tarea eliminada sintética', deletedAt: at, eventDisposition: 'deleted', automationKey: 'commission-follow-up:commission-expected' },
  ],
} as const;

export async function seedVisualWorkspace(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async ({ seededStores }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('world-memories-crm');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const names = Object.keys(seededStores);
    const transaction = database.transaction(names, 'readwrite');
    for (const name of names) {
      const store = transaction.objectStore(name);
      store.clear();
      for (const row of seededStores[name as keyof typeof seededStores]) store.put(row);
    }
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }, { seededStores: stores });
  await page.reload();
}
