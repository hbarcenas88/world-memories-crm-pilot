import Dexie, { type Table } from 'dexie';
import type { ActivityEvent, BackupDownload, Client, Commission, Lead, Payment, Provider, ProviderTaskTemplate, RichNote, Service, ServiceAdditionalItem, ServiceProvider, Task, Trip, WorkspaceConfiguration } from '../../domain/types';

export class WorldMemoriesDb extends Dexie {
  leads!: Table<Lead, string>;
  clients!: Table<Client, string>;
  trips!: Table<Trip, string>;
  tasks!: Table<Task, string>;
  payments!: Table<Payment, string>;
  services!: Table<Service, string>;
  notes!: Table<RichNote, string>;
  providers!: Table<Provider, string>;
  serviceProviders!: Table<ServiceProvider, string>;
  serviceAdditionalItems!: Table<ServiceAdditionalItem, string>;
  providerTaskTemplates!: Table<ProviderTaskTemplate, string>;
  commissions!: Table<Commission, string>;
  activityEvents!: Table<ActivityEvent, string>;
  backupDownloads!: Table<BackupDownload, string>;
  configurations!: Table<WorkspaceConfiguration, string>;

  constructor(name = 'world-memories-crm') {
    super(name);
    this.version(1).stores({
      leads: 'id,status,createdAt',
      activityEvents: 'id,aggregateId,type,occurredAt',
    });
    this.version(2).stores({
      leads: 'id,status,createdAt,clientId,tripId',
      clients: 'id,createdAt',
      trips: 'id,leadId,clientId,status,createdAt',
      activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(3).stores({
      leads: 'id,status,createdAt,clientId,tripId',
      clients: 'id,createdAt',
      trips: 'id,leadId,clientId,status,createdAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt',
      activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(4).stores({
      leads: 'id,status,createdAt,clientId,tripId',
      clients: 'id,createdAt',
      trips: 'id,leadId,clientId,status,createdAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt',
      payments: 'id,tripId,status,occurredAt,recordedAt',
      activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(5).stores({
      leads: 'id,status,createdAt,clientId,tripId',
      clients: 'id,createdAt,lastSavedAt',
      trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt',
      notes: 'id,ownerType,ownerId,updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt',
      payments: 'id,tripId,status,occurredAt,recordedAt',
      activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(6).stores({
      leads: 'id,status,createdAt,clientId,tripId',
      clients: 'id,createdAt,lastSavedAt',
      trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt',
      providers: 'id,status,createdAt',
      serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt',
      notes: 'id,ownerType,ownerId,updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt',
      payments: 'id,tripId,status,occurredAt,recordedAt',
      activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(7).stores({
      leads: 'id,status,createdAt,clientId,tripId', clients: 'id,createdAt,lastSavedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt', providers: 'id,status,createdAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt', notes: 'id,ownerType,ownerId,updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt', payments: 'id,tripId,status,occurredAt,recordedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(8).stores({
      leads: 'id,status,createdAt,clientId,tripId', clients: 'id,createdAt,lastSavedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt', providers: 'id,status,createdAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,createdAt', payments: 'id,tripId,status,occurredAt,recordedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(9).stores({
      leads: 'id,status,createdAt,clientId,tripId', clients: 'id,createdAt,lastSavedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt', providers: 'id,status,createdAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt', payments: 'id,tripId,status,occurredAt,recordedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt',
    });
    this.version(10).stores({
      leads: 'id,status,createdAt,clientId,tripId', clients: 'id,createdAt,lastSavedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt', providers: 'id,status,createdAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt', payments: 'id,tripId,status,occurredAt,recordedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt', backupDownloads: 'id,kind,downloadedAt',
    });
    this.version(11).stores({
      leads: 'id,status,createdAt,clientId,tripId,archivedAt', clients: 'id,createdAt,lastSavedAt,archivedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt,archivedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt,archivedAt', providers: 'id,status,createdAt,archivedAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt,archivedAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt,archivedAt', payments: 'id,tripId,status,occurredAt,recordedAt,archivedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt', backupDownloads: 'id,kind,downloadedAt',
    });
    this.version(12).stores({
      leads: 'id,status,createdAt,clientId,tripId,archivedAt', clients: 'id,createdAt,lastSavedAt,archivedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt,archivedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt,archivedAt', providers: 'id,status,createdAt,archivedAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt,archivedAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt,archivedAt', payments: 'id,tripId,status,occurredAt,recordedAt,archivedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt', backupDownloads: 'id,kind,downloadedAt', configurations: 'id,updatedAt',
    });
    this.version(13).stores({
      leads: 'id,status,createdAt,clientId,tripId,archivedAt', clients: 'id,createdAt,lastSavedAt,archivedAt', trips: 'id,leadId,clientId,status,createdAt,effectiveStartOn,effectiveEndOn,lastSavedAt,archivedAt',
      services: 'id,tripId,status,startOn,endOn,createdAt,archivedAt', providers: 'id,status,createdAt,archivedAt', serviceProviders: 'id,serviceId,providerId,currency,createdAt', serviceAdditionalItems: 'id,serviceId,currency,createdAt',
      providerTaskTemplates: 'id,providerId,active,createdAt', commissions: 'id,tripId,providerId,status,dueOn,paidOn,createdAt,archivedAt', notes: 'id,[ownerType+ownerId],updatedAt',
      tasks: 'id,status,dueOn,leadId,tripId,serviceProviderId,createdAt,archivedAt', payments: 'id,tripId,status,occurredAt,recordedAt,archivedAt', activityEvents: 'id,aggregateType,aggregateId,type,occurredAt', backupDownloads: 'id,kind,downloadedAt', configurations: 'id,updatedAt',
    });
  }

  async saveLeadWithEvents(lead: Lead, events: readonly ActivityEvent[]): Promise<void> {
    await this.transaction('rw', this.leads, this.activityEvents, async () => {
      await this.leads.put(lead);
      for (const event of events) {
        if (event.type.trim() === '') {
          throw new Error('activity event type is required');
        }
        await this.activityEvents.put(event);
      }
    });
  }
}
