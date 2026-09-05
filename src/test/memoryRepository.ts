import type { ActivityEvent, BackupDownload, Client, Commission, Lead, Payment, Provider, ProviderTaskTemplate, RichNote, Service, ServiceAdditionalItem, ServiceProvider, Task, Trip, WorkspaceConfiguration } from '../domain/types';
import type { WorkspaceRepository, WorkspaceTransaction } from '../application/ports';
import { assertWorkspaceSnapshot, type WorkspaceSnapshot } from '../application/workspaceSnapshot';
import { analyzeRecordImpact, type ManagedRecordRef } from '../application/recordImpact';
import { createDefaultWorkspaceConfiguration } from '../domain/workspaceConfiguration';

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly leads = new Map<string, Lead>();
  private readonly clients = new Map<string, Client>();
  private readonly trips = new Map<string, Trip>();
  private readonly services = new Map<string, Service>();
  private readonly notes = new Map<string, RichNote>();
  private readonly providers = new Map<string, Provider>();
  private readonly serviceProviders = new Map<string, ServiceProvider>();
  private readonly serviceAdditionalItems = new Map<string, ServiceAdditionalItem>();
  private readonly providerTaskTemplates = new Map<string, ProviderTaskTemplate>();
  private readonly commissions = new Map<string, Commission>();
  private readonly tasks = new Map<string, Task>();
  private readonly payments = new Map<string, Payment>();
  private readonly events = new Map<string, ActivityEvent>();
  private readonly backupDownloads = new Map<string, BackupDownload>();
  private configuration: WorkspaceConfiguration = createDefaultWorkspaceConfiguration();

  constructor(lead?: Lead) {
    if (lead) this.leads.set(lead.id, lead);
  }
  getLead(id: string) { return Promise.resolve(this.leads.get(id)); }
  getClient(id: string) { return Promise.resolve(this.clients.get(id)); }
  getTrip(id: string) { return Promise.resolve(this.trips.get(id)); }
  getTask(id: string) { return Promise.resolve(this.tasks.get(id)); }
  getService(id: string) { return Promise.resolve(this.services.get(id)); }
  getServiceProvider(id: string) { return Promise.resolve(this.serviceProviders.get(id)); }
  getServiceAdditionalItem(id: string) { return Promise.resolve(this.serviceAdditionalItems.get(id)); }
  getProvider(id: string) { return Promise.resolve(this.providers.get(id)); }
  getCommission(id: string) { return Promise.resolve(this.commissions.get(id)); }
  getConfiguration() { return Promise.resolve(this.configuration); }
  saveConfiguration(configuration: WorkspaceConfiguration) { this.configuration = configuration; return Promise.resolve(); }
  listLeads() { return Promise.resolve([...this.leads.values()]); }
  listClients() { return Promise.resolve([...this.clients.values()]); }
  listProviders() { return Promise.resolve([...this.providers.values()]); }
  listCommissions() { return Promise.resolve([...this.commissions.values()]); }
  listTrips() { return Promise.resolve([...this.trips.values()]); }
  listServicesForTrip(tripId: string) { return Promise.resolve([...this.services.values()].filter((service) => service.tripId === tripId)); }
  listServiceProvidersForService(serviceId: string) { return Promise.resolve([...this.serviceProviders.values()].filter((component) => component.serviceId === serviceId)); }
  listServiceAdditionalItemsForService(serviceId: string) { return Promise.resolve([...this.serviceAdditionalItems.values()].filter((item) => item.serviceId === serviceId)); }
  listNotesForOwner(ownerType: RichNote['ownerType'], ownerId: string) { return Promise.resolve([...this.notes.values()].filter((note) => note.ownerType === ownerType && note.ownerId === ownerId)); }
  listProviderTaskTemplates(providerId: string) { return Promise.resolve([...this.providerTaskTemplates.values()].filter((template) => template.providerId === providerId)); }
  listTasks() { return Promise.resolve([...this.tasks.values()]); }
  listTasksForLead(leadId: string) { return Promise.resolve([...this.tasks.values()].filter((task) => task.leadId === leadId)); }
  listTasksForTrip(tripId: string) { return Promise.resolve([...this.tasks.values()].filter((task) => task.tripId === tripId)); }
  listPaymentsForTrip(tripId: string) { return Promise.resolve([...this.payments.values()].filter((payment) => payment.tripId === tripId)); }
  listEventsForAggregate(aggregateId: string) { return Promise.resolve([...this.events.values()].filter((event) => event.aggregateId === aggregateId)); }
  listBackupDownloads() { return Promise.resolve([...this.backupDownloads.values()].sort((left, right) => right.downloadedAt.localeCompare(left.downloadedAt))); }
  recordBackupDownload(download: BackupDownload) { this.backupDownloads.set(download.id, download); return Promise.resolve(); }
  dismissBackupReminder(id: string, until: string) { const current = this.backupDownloads.get(id); if (!current) return Promise.reject(new Error('backup download not found')); this.backupDownloads.set(id, { ...current, reminderDismissedUntil: until }); return Promise.resolve(); }
  snapshot(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({ schemaVersion: 2, exportedAt: new Date().toISOString(), configuration: this.configuration, leads: [...this.leads.values()], clients: [...this.clients.values()], trips: [...this.trips.values()], services: [...this.services.values()], serviceProviders: [...this.serviceProviders.values()], serviceAdditionalItems: [...this.serviceAdditionalItems.values()], providers: [...this.providers.values()], providerTaskTemplates: [...this.providerTaskTemplates.values()], commissions: [...this.commissions.values()], notes: [...this.notes.values()], tasks: [...this.tasks.values()], payments: [...this.payments.values()], events: [...this.events.values()] });
  }
  async replaceSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    assertWorkspaceSnapshot(snapshot);
    const current = await this.snapshot();
    try {
      this.replaceAll(this.leads, snapshot.leads); this.replaceAll(this.clients, snapshot.clients); this.replaceAll(this.trips, snapshot.trips); this.replaceAll(this.services, snapshot.services); this.replaceAll(this.serviceProviders, snapshot.serviceProviders); this.replaceAll(this.serviceAdditionalItems, snapshot.serviceAdditionalItems); this.replaceAll(this.providers, snapshot.providers); this.replaceAll(this.providerTaskTemplates, snapshot.providerTaskTemplates); this.replaceAll(this.commissions, snapshot.commissions); this.replaceAll(this.notes, snapshot.notes); this.replaceAll(this.tasks, snapshot.tasks); this.replaceAll(this.payments, snapshot.payments); this.replaceAll(this.events, snapshot.events); this.configuration = snapshot.configuration;
    } catch (error) { await this.replaceSnapshot(current); throw error; }
  }
  async transact<T>(work: (tx: WorkspaceTransaction) => Promise<T>): Promise<T> {
    const leads = new Map(this.leads);
    const clients = new Map(this.clients);
    const trips = new Map(this.trips);
    const services = new Map(this.services);
    const notes = new Map(this.notes);
    const providers = new Map(this.providers);
    const serviceProviders = new Map(this.serviceProviders);
    const serviceAdditionalItems = new Map(this.serviceAdditionalItems);
    const providerTaskTemplates = new Map(this.providerTaskTemplates);
    const commissions = new Map(this.commissions);
    const tasks = new Map(this.tasks);
    const payments = new Map(this.payments);
    const events = new Map(this.events);
    const configuration = this.configuration;
    const tx: WorkspaceTransaction = {
      getLead: (id) => Promise.resolve(this.leads.get(id)),
      getClient: (id) => Promise.resolve(this.clients.get(id)),
      getTrip: (id) => Promise.resolve(this.trips.get(id)),
      getTask: (id) => Promise.resolve(this.tasks.get(id)),
      getService: (id) => Promise.resolve(this.services.get(id)),
      getServiceProvider: (id) => Promise.resolve(this.serviceProviders.get(id)),
      getServiceAdditionalItem: (id) => Promise.resolve(this.serviceAdditionalItems.get(id)),
      getPayment: (id) => Promise.resolve(this.payments.get(id)),
      getProvider: (id) => Promise.resolve(this.providers.get(id)),
      getProviderTaskTemplate: (id) => Promise.resolve(this.providerTaskTemplates.get(id)),
      getCommission: (id) => Promise.resolve(this.commissions.get(id)),
      getNote: (id) => Promise.resolve(this.notes.get(id)),
      getEvent: (id) => Promise.resolve(this.events.get(id)),
      getConfiguration: () => Promise.resolve(this.configuration),
      getRecordImpact: async (target) => analyzeRecordImpact(await this.snapshot(), target),
      listProviderTaskTemplates: (providerId) => Promise.resolve([...this.providerTaskTemplates.values()].filter((template) => template.providerId === providerId)),
      listCommissionsForServiceProvider: (serviceProviderId) => Promise.resolve([...this.commissions.values()].filter((commission) => commission.serviceProviderId === serviceProviderId)),
      listCommissionsForTrip: (tripId) => Promise.resolve([...this.commissions.values()].filter((commission) => commission.tripId === tripId)),
      listTasksForTrip: (tripId) => Promise.resolve([...this.tasks.values()].filter((task) => task.tripId === tripId)),
      putLead: (lead) => {
        if (lead.clientId && !this.clients.has(lead.clientId)) return Promise.reject(new Error('lead client not found'));
        if (lead.tripId && !this.trips.has(lead.tripId)) return Promise.reject(new Error('lead trip not found'));
        this.leads.set(lead.id, lead); return Promise.resolve();
      },
      putClient: (client) => { this.clients.set(client.id, client); return Promise.resolve(); },
      putTrip: (trip) => {
        if (!this.leads.has(trip.leadId)) return Promise.reject(new Error('trip lead not found'));
        if (!this.clients.has(trip.clientId)) return Promise.reject(new Error('trip client not found'));
        this.trips.set(trip.id, trip); return Promise.resolve();
      },
      putService: (service) => {
        if (!this.trips.has(service.tripId)) return Promise.reject(new Error('service trip not found'));
        this.services.set(service.id, service); return Promise.resolve();
      },
      putProvider: (provider) => { this.providers.set(provider.id, provider); return Promise.resolve(); },
      putProviderTaskTemplate: (template) => {
        if (!this.providers.has(template.providerId)) return Promise.reject(new Error('provider task template provider not found'));
        this.providerTaskTemplates.set(template.id, template); return Promise.resolve();
      },
      putNote: (note) => {
        const ownerExists = note.ownerType === 'client' ? this.clients.has(note.ownerId) : this.trips.has(note.ownerId);
        if (!ownerExists) return Promise.reject(new Error('note owner not found'));
        this.notes.set(note.id, note); return Promise.resolve();
      },
      putServiceProvider: (serviceProvider) => {
        const service = this.services.get(serviceProvider.serviceId);
        const provider = this.providers.get(serviceProvider.providerId);
        if (!service) return Promise.reject(new Error('service provider service not found'));
        if (!provider) return Promise.reject(new Error('service provider provider not found'));
        if (!provider.allowedCurrencies.includes(serviceProvider.currency)) return Promise.reject(new Error('provider does not allow selected currency'));
        this.serviceProviders.set(serviceProvider.id, serviceProvider); return Promise.resolve();
      },
      putServiceAdditionalItem: (item) => {
        if (!this.services.has(item.serviceId)) return Promise.reject(new Error('service additional item service not found'));
        this.serviceAdditionalItems.set(item.id, item); return Promise.resolve();
      },
      putCommission: (commission) => {
        if (!this.trips.has(commission.tripId)) return Promise.reject(new Error('commission trip not found'));
        if (!this.providers.has(commission.providerId)) return Promise.reject(new Error('commission provider not found'));
        this.commissions.set(commission.id, commission); return Promise.resolve();
      },
      putPayment: (payment) => {
        if (!this.trips.has(payment.tripId)) return Promise.reject(new Error('payment trip not found'));
        this.payments.set(payment.id, payment); return Promise.resolve();
      },
      putTask: (task) => {
        if (task.leadId && !this.leads.has(task.leadId)) return Promise.reject(new Error('task lead not found'));
        if (task.tripId && !this.trips.has(task.tripId)) return Promise.reject(new Error('task trip not found'));
        if (task.commissionId) {
          const commission = this.commissions.get(task.commissionId);
          if (!commission) return Promise.reject(new Error('task commission not found'));
          if (task.tripId && task.tripId !== commission.tripId) return Promise.reject(new Error('task commission does not belong to trip'));
        }
        if (task.serviceProviderId) {
          const component = this.serviceProviders.get(task.serviceProviderId);
          const service = component ? this.services.get(component.serviceId) : undefined;
          if (!component || !service) return Promise.reject(new Error('task service provider not found'));
          if (task.tripId !== service.tripId) return Promise.reject(new Error('task service provider does not belong to trip'));
        }
        this.tasks.set(task.id, task); return Promise.resolve();
      },
      putConfiguration: (nextConfiguration) => { this.configuration = nextConfiguration; return Promise.resolve(); },
      putEvents: (newEvents) => {
        for (const event of newEvents) {
          if (event.type.trim() === '') return Promise.reject(new Error('activity event type is required'));
          const aggregateExists = event.aggregateType === 'lead' ? this.leads.has(event.aggregateId)
            : event.aggregateType === 'client' ? this.clients.has(event.aggregateId)
              : event.aggregateType === 'trip' ? this.trips.has(event.aggregateId)
              : event.aggregateType === 'service' ? this.services.has(event.aggregateId)
                : event.aggregateType === 'provider' ? this.providers.has(event.aggregateId)
                  : event.aggregateType === 'payment' ? this.payments.has(event.aggregateId)
                    : event.aggregateType === 'task' ? this.tasks.has(event.aggregateId)
                      : event.aggregateType === 'commission' ? this.commissions.has(event.aggregateId)
                        : false;
          if (!aggregateExists) return Promise.reject(new Error('activity event aggregate not found'));
          this.events.set(event.id, event);
        }
        return Promise.resolve();
      },
      deleteRecord: (target: ManagedRecordRef) => {
        if (target.kind === 'lead') this.leads.delete(target.id);
        else if (target.kind === 'client') this.clients.delete(target.id);
        else if (target.kind === 'trip') this.trips.delete(target.id);
        else if (target.kind === 'provider') this.providers.delete(target.id);
        else if (target.kind === 'service') this.services.delete(target.id);
        else if (target.kind === 'payment') this.payments.delete(target.id);
        else if (target.kind === 'commission') this.commissions.delete(target.id);
        else this.tasks.delete(target.id);
        return Promise.resolve();
      },
    };
    try {
      return await work(tx);
    } catch (error) {
      this.restore(this.leads, leads);
      this.restore(this.clients, clients);
      this.restore(this.trips, trips);
      this.restore(this.services, services);
      this.restore(this.notes, notes);
      this.restore(this.providers, providers);
      this.restore(this.serviceProviders, serviceProviders);
      this.restore(this.serviceAdditionalItems, serviceAdditionalItems);
      this.restore(this.providerTaskTemplates, providerTaskTemplates);
      this.restore(this.commissions, commissions);
      this.restore(this.tasks, tasks);
      this.restore(this.payments, payments);
      this.restore(this.events, events);
      this.configuration = configuration;
      throw error;
    }
  }

  putClient(client: Client) { this.clients.set(client.id, client); return Promise.resolve(); }

  seedClient(client: Client): Promise<void> {
    return this.putClient(client);
  }

  seedTask(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
    return Promise.resolve();
  }

  seedTrip(trip: Trip): Promise<void> {
    this.trips.set(trip.id, trip);
    return Promise.resolve();
  }

  seedService(service: Service): Promise<void> {
    this.services.set(service.id, service);
    return Promise.resolve();
  }

  seedServiceProvider(serviceProvider: ServiceProvider): Promise<void> { this.serviceProviders.set(serviceProvider.id, serviceProvider); return Promise.resolve(); }

  seedPayment(payment: Payment): Promise<void> { this.payments.set(payment.id, payment); return Promise.resolve(); }

  seedProvider(provider: Provider): Promise<void> {
    this.providers.set(provider.id, provider);
    return Promise.resolve();
  }

  seedProviderTaskTemplate(template: ProviderTaskTemplate): Promise<void> {
    this.providerTaskTemplates.set(template.id, template);
    return Promise.resolve();
  }

  seedCommission(commission: Commission): Promise<void> {
    this.commissions.set(commission.id, commission);
    return Promise.resolve();
  }

  private restore<T>(target: Map<string, T>, snapshot: Map<string, T>): void {
    target.clear();
    snapshot.forEach((value, key) => target.set(key, value));
  }

  private replaceAll<T extends { id: string }>(target: Map<string, T>, records: readonly T[]): void { target.clear(); records.forEach((record) => target.set(record.id, record)); }
}
