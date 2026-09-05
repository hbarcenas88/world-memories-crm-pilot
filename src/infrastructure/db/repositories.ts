import type { WorkspaceRepository, WorkspaceTransaction } from '../../application/ports';
import type { ActivityEvent, BackupDownload, Client, Commission, Lead, Payment, Provider, ProviderTaskTemplate, RichNote, Service, ServiceAdditionalItem, ServiceProvider, Task, Trip, WorkspaceConfiguration } from '../../domain/types';
import { WorldMemoriesDb } from './worldMemoriesDb';
import { assertWorkspaceSnapshot, type WorkspaceSnapshot } from '../../application/workspaceSnapshot';
import { analyzeRecordImpact, type ManagedRecordRef } from '../../application/recordImpact';
import { createDefaultWorkspaceConfiguration } from '../../domain/workspaceConfiguration';

function assertEvent(event: ActivityEvent): void {
  if (event.type.trim() === '') throw new Error('activity event type is required');
}

function assertTaskReference(task: Task, lead?: Lead, trip?: Trip, service?: Service, commission?: Commission): void {
  if (task.leadId && !lead) throw new Error('task lead not found');
  if (task.tripId && !trip) throw new Error('task trip not found');
  if (task.serviceProviderId && !service) throw new Error('task service provider not found');
  if (task.serviceProviderId && task.tripId !== service?.tripId) throw new Error('task service provider does not belong to trip');
  if (task.commissionId && !commission) throw new Error('task commission not found');
  if (task.commissionId && task.tripId && task.tripId !== commission?.tripId) throw new Error('task commission does not belong to trip');
}

async function assertEventAggregate(db: WorldMemoriesDb, event: ActivityEvent): Promise<void> {
  const aggregateExists = event.aggregateType === 'lead' ? await db.leads.get(event.aggregateId)
    : event.aggregateType === 'client' ? await db.clients.get(event.aggregateId)
        : event.aggregateType === 'trip' ? await db.trips.get(event.aggregateId)
            : event.aggregateType === 'service' ? await db.services.get(event.aggregateId)
            : event.aggregateType === 'provider' ? await db.providers.get(event.aggregateId)
              : event.aggregateType === 'payment' ? await db.payments.get(event.aggregateId)
                : event.aggregateType === 'task' ? await db.tasks.get(event.aggregateId)
                  : event.aggregateType === 'commission' ? await db.commissions.get(event.aggregateId)
                    : undefined;
  if (!aggregateExists) throw new Error('activity event aggregate not found');
}

export class DexieWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: WorldMemoriesDb) {}

  getLead(id: string): Promise<Lead | undefined> {
    return this.db.leads.get(id);
  }

  getClient(id: string): Promise<Client | undefined> {
    return this.db.clients.get(id);
  }

  getTrip(id: string): Promise<Trip | undefined> {
    return this.db.trips.get(id);
  }

  getTask(id: string): Promise<Task | undefined> {
    return this.db.tasks.get(id);
  }

  getService(id: string): Promise<Service | undefined> {
    return this.db.services.get(id);
  }

  getServiceProvider(id: string): Promise<ServiceProvider | undefined> { return this.db.serviceProviders.get(id); }
  getServiceAdditionalItem(id: string): Promise<ServiceAdditionalItem | undefined> { return this.db.serviceAdditionalItems.get(id); }

  getProvider(id: string): Promise<Provider | undefined> {
    return this.db.providers.get(id);
  }

  getCommission(id: string): Promise<Commission | undefined> {
    return this.db.commissions.get(id);
  }

  async getConfiguration(): Promise<WorkspaceConfiguration> {
    const existing = await this.db.configurations.get('workspace-configuration');
    if (existing) return existing;
    const configuration = createDefaultWorkspaceConfiguration();
    await this.db.configurations.put(configuration);
    return configuration;
  }

  async saveConfiguration(configuration: WorkspaceConfiguration): Promise<void> {
    await this.db.configurations.put(configuration);
  }

  async listLeads(): Promise<readonly Lead[]> {
    return this.db.leads.orderBy('createdAt').reverse().toArray();
  }

  async listClients(): Promise<readonly Client[]> {
    return this.db.clients.orderBy('createdAt').reverse().toArray();
  }

  async listProviders(): Promise<readonly Provider[]> {
    return this.db.providers.orderBy('createdAt').reverse().toArray();
  }

  async listCommissions(): Promise<readonly Commission[]> {
    return this.db.commissions.orderBy('dueOn').toArray();
  }

  async listTrips(): Promise<readonly Trip[]> {
    return this.db.trips.orderBy('createdAt').reverse().toArray();
  }

  async listServicesForTrip(tripId: string): Promise<readonly Service[]> {
    return this.db.services.where('tripId').equals(tripId).toArray();
  }

  async listServiceProvidersForService(serviceId: string): Promise<readonly ServiceProvider[]> {
    return this.db.serviceProviders.where('serviceId').equals(serviceId).toArray();
  }
  async listServiceAdditionalItemsForService(serviceId: string): Promise<readonly ServiceAdditionalItem[]> { return this.db.serviceAdditionalItems.where('serviceId').equals(serviceId).toArray(); }

  async listNotesForOwner(ownerType: RichNote['ownerType'], ownerId: string): Promise<readonly RichNote[]> {
    return this.db.notes.where({ ownerType, ownerId }).toArray();
  }

  async listProviderTaskTemplates(providerId: string): Promise<readonly ProviderTaskTemplate[]> {
    return this.db.providerTaskTemplates.where('providerId').equals(providerId).toArray();
  }

  async listTasks(): Promise<readonly Task[]> {
    return this.db.tasks.orderBy('createdAt').reverse().toArray();
  }

  async listTasksForLead(leadId: string): Promise<readonly Task[]> {
    return this.db.tasks.where('leadId').equals(leadId).toArray();
  }

  async listTasksForTrip(tripId: string): Promise<readonly Task[]> {
    return this.db.tasks.where('tripId').equals(tripId).toArray();
  }

  async listPaymentsForTrip(tripId: string): Promise<readonly Payment[]> {
    return this.db.payments.where('tripId').equals(tripId).sortBy('occurredAt');
  }

  async listEventsForAggregate(aggregateId: string): Promise<readonly ActivityEvent[]> {
    return this.db.activityEvents.where('aggregateId').equals(aggregateId).sortBy('occurredAt');
  }
  async listBackupDownloads(): Promise<readonly BackupDownload[]> { return this.db.backupDownloads.orderBy('downloadedAt').reverse().toArray(); }
  async recordBackupDownload(download: BackupDownload): Promise<void> { await this.db.backupDownloads.put(download); }
  async dismissBackupReminder(id: string, until: string): Promise<void> { const current = await this.db.backupDownloads.get(id); if (!current) throw new Error('backup download not found'); await this.db.backupDownloads.put({ ...current, reminderDismissedUntil: until }); }

  async snapshot(): Promise<WorkspaceSnapshot> {
    const [leads, clients, trips, services, serviceProviders, serviceAdditionalItems, providers, providerTaskTemplates, commissions, notes, tasks, payments, events, configuration] = await Promise.all([this.db.leads.toArray(), this.db.clients.toArray(), this.db.trips.toArray(), this.db.services.toArray(), this.db.serviceProviders.toArray(), this.db.serviceAdditionalItems.toArray(), this.db.providers.toArray(), this.db.providerTaskTemplates.toArray(), this.db.commissions.toArray(), this.db.notes.toArray(), this.db.tasks.toArray(), this.db.payments.toArray(), this.db.activityEvents.toArray(), this.getConfiguration()]);
    return { schemaVersion: 2, exportedAt: new Date().toISOString(), configuration, leads, clients, trips, services, serviceProviders, serviceAdditionalItems, providers, providerTaskTemplates, commissions, notes, tasks, payments, events };
  }

  async replaceSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    assertWorkspaceSnapshot(snapshot);
    await this.db.transaction('rw', [this.db.leads, this.db.clients, this.db.trips, this.db.services, this.db.serviceProviders, this.db.serviceAdditionalItems, this.db.providers, this.db.providerTaskTemplates, this.db.commissions, this.db.notes, this.db.tasks, this.db.payments, this.db.activityEvents, this.db.configurations], async () => {
      await Promise.all([this.db.leads.clear(), this.db.clients.clear(), this.db.trips.clear(), this.db.services.clear(), this.db.serviceProviders.clear(), this.db.serviceAdditionalItems.clear(), this.db.providers.clear(), this.db.providerTaskTemplates.clear(), this.db.commissions.clear(), this.db.notes.clear(), this.db.tasks.clear(), this.db.payments.clear(), this.db.activityEvents.clear(), this.db.configurations.clear()]);
      await this.db.clients.bulkPut(snapshot.clients); await this.db.providers.bulkPut(snapshot.providers); await this.db.leads.bulkPut(snapshot.leads); await this.db.trips.bulkPut(snapshot.trips); await this.db.services.bulkPut(snapshot.services); await this.db.serviceProviders.bulkPut(snapshot.serviceProviders); await this.db.serviceAdditionalItems.bulkPut(snapshot.serviceAdditionalItems); await this.db.providerTaskTemplates.bulkPut(snapshot.providerTaskTemplates); await this.db.commissions.bulkPut(snapshot.commissions); await this.db.notes.bulkPut(snapshot.notes); await this.db.tasks.bulkPut(snapshot.tasks); await this.db.payments.bulkPut(snapshot.payments); await this.db.activityEvents.bulkPut(snapshot.events); await this.db.configurations.put(snapshot.configuration);
    });
  }

  async transact<T>(work: (tx: WorkspaceTransaction) => Promise<T>): Promise<T> {
    return this.db.transaction('rw', [this.db.leads, this.db.clients, this.db.trips, this.db.services, this.db.providers, this.db.serviceProviders, this.db.serviceAdditionalItems, this.db.providerTaskTemplates, this.db.commissions, this.db.notes, this.db.tasks, this.db.payments, this.db.activityEvents, this.db.configurations], async () => {
      const tx: WorkspaceTransaction = {
        getLead: (id) => this.db.leads.get(id),
        getClient: (id) => this.db.clients.get(id),
        getTrip: (id) => this.db.trips.get(id),
        getTask: (id) => this.db.tasks.get(id),
        getService: (id) => this.db.services.get(id),
        getServiceProvider: (id) => this.db.serviceProviders.get(id),
        getServiceAdditionalItem: (id) => this.db.serviceAdditionalItems.get(id),
        getPayment: (id) => this.db.payments.get(id),
        getProvider: (id) => this.db.providers.get(id),
        getProviderTaskTemplate: (id) => this.db.providerTaskTemplates.get(id),
        getCommission: (id) => this.db.commissions.get(id),
        getNote: (id) => this.db.notes.get(id),
        getEvent: (id) => this.db.activityEvents.get(id),
        getConfiguration: async () => (await this.db.configurations.get('workspace-configuration')) ?? createDefaultWorkspaceConfiguration(),
        getRecordImpact: async (target) => analyzeRecordImpact({
          schemaVersion: 2,
          exportedAt: new Date().toISOString(),
          configuration: await this.getConfiguration(),
          leads: await this.db.leads.toArray(),
          clients: await this.db.clients.toArray(),
          trips: await this.db.trips.toArray(),
          services: await this.db.services.toArray(),
          serviceProviders: await this.db.serviceProviders.toArray(),
          serviceAdditionalItems: await this.db.serviceAdditionalItems.toArray(),
          providers: await this.db.providers.toArray(),
          providerTaskTemplates: await this.db.providerTaskTemplates.toArray(),
          commissions: await this.db.commissions.toArray(),
          notes: await this.db.notes.toArray(),
          tasks: await this.db.tasks.toArray(),
          payments: await this.db.payments.toArray(),
          events: await this.db.activityEvents.toArray(),
        }, target),
        listProviderTaskTemplates: (providerId) => this.db.providerTaskTemplates.where('providerId').equals(providerId).toArray(),
        listCommissionsForServiceProvider: async (serviceProviderId) => (await this.db.commissions.toArray()).filter((commission) => commission.serviceProviderId === serviceProviderId),
        listCommissionsForTrip: (tripId) => this.db.commissions.where('tripId').equals(tripId).toArray(),
        listTasksForTrip: (tripId) => this.db.tasks.where('tripId').equals(tripId).toArray(),
        putLead: async (lead) => {
          if (lead.clientId && !(await this.db.clients.get(lead.clientId))) throw new Error('lead client not found');
          if (lead.tripId && !(await this.db.trips.get(lead.tripId))) throw new Error('lead trip not found');
          await this.db.leads.put(lead);
        },
        putClient: async (client) => { await this.db.clients.put(client); },
        putTrip: async (trip) => {
          if (!(await this.db.leads.get(trip.leadId))) throw new Error('trip lead not found');
          if (!(await this.db.clients.get(trip.clientId))) throw new Error('trip client not found');
          await this.db.trips.put(trip);
        },
        putService: async (service) => {
          if (!(await this.db.trips.get(service.tripId))) throw new Error('service trip not found');
          await this.db.services.put(service);
        },
        putProvider: async (provider) => { await this.db.providers.put(provider); },
        putProviderTaskTemplate: async (template) => {
          if (!(await this.db.providers.get(template.providerId))) throw new Error('provider task template provider not found');
          await this.db.providerTaskTemplates.put(template);
        },
        putNote: async (note) => {
          const owner = note.ownerType === 'client' ? await this.db.clients.get(note.ownerId) : await this.db.trips.get(note.ownerId);
          if (!owner) throw new Error('note owner not found');
          await this.db.notes.put(note);
        },
        putServiceProvider: async (serviceProvider) => {
          const [service, provider] = await Promise.all([this.db.services.get(serviceProvider.serviceId), this.db.providers.get(serviceProvider.providerId)]);
          if (!service) throw new Error('service provider service not found');
          if (!provider) throw new Error('service provider provider not found');
          if (!provider.allowedCurrencies.includes(serviceProvider.currency)) throw new Error('provider does not allow selected currency');
          await this.db.serviceProviders.put(serviceProvider);
        },
        putServiceAdditionalItem: async (item) => {
          if (!(await this.db.services.get(item.serviceId))) throw new Error('service additional item service not found');
          await this.db.serviceAdditionalItems.put(item);
        },
        putCommission: async (commission) => {
          const [trip, provider] = await Promise.all([this.db.trips.get(commission.tripId), this.db.providers.get(commission.providerId)]);
          if (!trip) throw new Error('commission trip not found');
          if (!provider) throw new Error('commission provider not found');
          await this.db.commissions.put(commission);
        },
        putPayment: async (payment) => {
          if (!(await this.db.trips.get(payment.tripId))) throw new Error('payment trip not found');
          await this.db.payments.put(payment);
        },
        putTask: async (task) => {
          const component = task.serviceProviderId ? await this.db.serviceProviders.get(task.serviceProviderId) : undefined;
          const [lead, trip, service, commission] = await Promise.all([task.leadId ? this.db.leads.get(task.leadId) : undefined, task.tripId ? this.db.trips.get(task.tripId) : undefined, component ? this.db.services.get(component.serviceId) : undefined, task.commissionId ? this.db.commissions.get(task.commissionId) : undefined]);
          assertTaskReference(task, lead, trip, service, commission);
          await this.db.tasks.put(task);
        },
        putConfiguration: async (configuration) => { await this.db.configurations.put(configuration); },
        putEvents: async (events) => {
          for (const event of events) {
            assertEvent(event);
            await assertEventAggregate(this.db, event);
            await this.db.activityEvents.put(event);
          }
        },
        deleteRecord: async (target: ManagedRecordRef) => {
          if (target.kind === 'lead') { await this.db.leads.delete(target.id); return; }
          if (target.kind === 'client') { await this.db.clients.delete(target.id); return; }
          if (target.kind === 'trip') { await this.db.trips.delete(target.id); return; }
          if (target.kind === 'provider') { await this.db.providers.delete(target.id); return; }
          if (target.kind === 'service') { await this.db.services.delete(target.id); return; }
          if (target.kind === 'payment') { await this.db.payments.delete(target.id); return; }
          if (target.kind === 'commission') { await this.db.commissions.delete(target.id); return; }
          await this.db.tasks.delete(target.id);
        },
      };
      return work(tx);
    });
  }
}
