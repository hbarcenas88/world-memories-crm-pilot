import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { applyCsvImport, previewCsvPackage } from '../../src/infrastructure/import/csvImport';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

async function packageFile(files: Record<string, string>): Promise<File> {
  const entries = Object.entries(files).map(([name, content]) => [name, strToU8(content)] as const);
  const manifest = { format: 'world-memories-import', schemaVersion: 1, exportedAt: '2026-08-27T00:00:00.000Z', files: await Promise.all(entries.map(async ([name, content]) => ({ name, checksum: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', content)), (byte) => byte.toString(16).padStart(2, '0')).join(''), rowCount: Math.max(0, new TextDecoder().decode(content).trim().split(/\r?\n/).length - 1) }))) };
  return new File([zipSync({ ...Object.fromEntries(entries), 'manifest.json': strToU8(JSON.stringify(manifest)) })], 'world-memories-import.zip', { type: 'application/zip' });
}

describe('CSV package import', () => {
  it('previews valid, duplicate, rejected and orphaned rows without persisting any of them', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-existing', name: 'Lead existente', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' });
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at\nlead-existing,Duplicado,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z\nlead-new,Lead nuevo,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z\nlead-rejected,,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z',
      'trips.csv': 'id,lead_id,client_id,status,created_at\ntrip-orphan,lead-missing,client-missing,active,2026-08-20T00:00:00.000Z',
    });

    const preview = await previewCsvPackage(file, repository);

    expect(preview).toMatchObject({ accepted: 1, duplicates: 1, rejected: 2 });
    expect(preview.issues.map((issue) => issue.reason)).toEqual(expect.arrayContaining(['ID ya existe', 'Nombre obligatorio', 'Referencia de Lead o Cliente inexistente']));
    await expect(repository.listLeads()).resolves.toHaveLength(1);
  });

  it('rejects a manifest that omits its auditable export date and file counts', async () => {
    const repository = new MemoryWorkspaceRepository();
    const file = new File([zipSync({
      'manifest.json': strToU8(JSON.stringify({ format: 'world-memories-import', schemaVersion: 1, files: [] })),
    })], 'incomplete-manifest.zip', { type: 'application/zip' });

    await expect(previewCsvPackage(file, repository)).rejects.toThrow('metadatos de fecha o conteos');
  });

  it('rejects a manifest whose declared row count does not match its CSV', async () => {
    const repository = new MemoryWorkspaceRepository();
    const content = strToU8('id,name,acquisition_source,requested_date_status,status,created_at\nlead-1,Lead,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z');
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', content)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const file = new File([zipSync({
      'leads.csv': content,
      'manifest.json': strToU8(JSON.stringify({ format: 'world-memories-import', schemaVersion: 1, exportedAt: '2026-08-27T00:00:00.000Z', files: [{ name: 'leads.csv', checksum, rowCount: 0 }] })),
    })], 'wrong-row-count.zip', { type: 'application/zip' });

    await expect(previewCsvPackage(file, repository)).rejects.toThrow('El conteo no coincide para leads.csv');
  });

  it('confirms only independently accepted rows and never overwrites an existing record', async () => {
    const repository = new MemoryWorkspaceRepository({ id: 'lead-existing', name: 'Lead existente', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' });
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at\nlead-existing,Sobrescritura,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z\nlead-new,Lead nuevo,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z',
    });

    const preview = await previewCsvPackage(file, repository);
    await applyCsvImport(preview, repository);

    await expect(repository.getLead('lead-existing')).resolves.toMatchObject({ name: 'Lead existente' });
    await expect(repository.getLead('lead-new')).resolves.toMatchObject({ name: 'Lead nuevo' });
  });

  it('rolls back the full confirmation when a non-Lead duplicate appears after preview', async () => {
    const repository = new MemoryWorkspaceRepository();
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at\nlead-new,Lead nuevo,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z',
      'providers.csv': 'id,name,status,allowed_currencies,created_at\nprovider-late,Proveedor importado,active,USD,2026-08-20T00:00:00.000Z',
    });
    const preview = await previewCsvPackage(file, repository);
    await repository.seedProvider({ id: 'provider-late', name: 'Proveedor existente', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-08-20T00:00:00.000Z' });

    await expect(applyCsvImport(preview, repository)).rejects.toThrow('El registro ya existe');
    await expect(repository.getLead('lead-new')).resolves.toBeUndefined();
    await expect(repository.getProvider('provider-late')).resolves.toMatchObject({ name: 'Proveedor existente' });
  });

  it('imports a complete related workspace in dependency order from one additive package', async () => {
    const repository = new MemoryWorkspaceRepository();
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at\nlead-1,Lead nuevo,Web,dates_to_define,sold,2026-08-20T00:00:00.000Z',
      'clients.csv': 'id,name,created_at\nclient-1,Familia nueva,2026-08-20T00:00:00.000Z',
      'trips.csv': 'id,lead_id,client_id,status,created_at\ntrip-1,lead-1,client-1,active,2026-08-20T00:00:00.000Z',
      'providers.csv': 'id,name,status,allowed_currencies,created_at\nprovider-1,Proveedor nuevo,active,USD,2026-08-20T00:00:00.000Z',
      'services.csv': 'id,trip_id,name,status,created_at\nservice-1,trip-1,Hotel,active,2026-08-20T00:00:00.000Z',
      'service_providers.csv': 'id,service_id,provider_id,currency,commission_status,created_at\ncomponent-1,service-1,provider-1,USD,with_commission,2026-08-20T00:00:00.000Z',
      'service_additional_items.csv': 'id,service_id,label,amount,currency,created_at\nadditional-1,service-1,Traslado,125,USD,2026-08-20T00:00:00.000Z',
      'provider_task_templates.csv': 'id,provider_id,title,required,relative_to,active,created_at\ntemplate-1,provider-1,Confirmar,false,manual,true,2026-08-20T00:00:00.000Z',
      'commissions.csv': 'id,trip_id,provider_id,service_provider_id,expected_amount,expected_currency,status,created_at\ncommission-1,trip-1,provider-1,component-1,80,USD,expected,2026-08-20T00:00:00.000Z',
      'tasks.csv': 'id,title,required,status,trip_id,service_provider_id,created_at\ntask-1,Confirmar,false,open,trip-1,component-1,2026-08-20T00:00:00.000Z',
      'notes.csv': 'id,owner_type,owner_id,content,updated_at\nnote-1,trip,trip-1,Nota importada,2026-08-20T00:00:00.000Z',
      'payments.csv': 'id,trip_id,amount,amount_currency,occurred_at,recorded_at,status,source\npayment-1,trip-1,100,USD,2026-08-20T00:00:00.000Z,2026-08-20T00:00:00.000Z,received,customer_payment',
      'activity_events.csv': 'id,aggregate_type,aggregate_id,type,occurred_at,recorded_at,payload_json\nevent-1,trip,trip-1,trip_imported,2026-08-20T00:00:00.000Z,2026-08-20T00:00:00.000Z,{}',
    });

    const preview = await previewCsvPackage(file, repository);
    await applyCsvImport(preview, repository);
    const snapshot = await repository.snapshot();

    expect(preview).toMatchObject({ accepted: 13, duplicates: 0, rejected: 0 });
    expect(snapshot).toMatchObject({ clients: [{ id: 'client-1' }], providers: [{ id: 'provider-1' }], services: [{ id: 'service-1' }], serviceProviders: [{ id: 'component-1' }], serviceAdditionalItems: [{ id: 'additional-1', label: 'Traslado' }], providerTaskTemplates: [{ id: 'template-1' }], commissions: [{ id: 'commission-1' }], tasks: [{ id: 'task-1' }], notes: [{ id: 'note-1' }], payments: [{ id: 'payment-1' }], events: [{ id: 'event-1' }] });
  });

  it('preserves optional operational fields instead of reducing an accepted CSV row', async () => {
    const repository = new MemoryWorkspaceRepository();
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at,referred_by,residence_country,phone,email,destination,travel_type,budget_amount,budget_currency\nlead-1,Lead completo,Referido,dates_known,contacted,2026-08-20T00:00:00.000Z,Ana,Panamá,+50760000000,lead@example.test,Orlando,Paquete Disney,2500,USD',
      'clients.csv': 'id,name,created_at,family_note\nclient-1,Familia completa,2026-08-20T00:00:00.000Z,Prefieren habitaciones conectadas',
      'trips.csv': 'id,lead_id,client_id,status,created_at,computed_start_on,computed_end_on,override_start_on,override_end_on,effective_start_on,effective_end_on\ntrip-1,lead-1,client-1,active,2026-08-20T00:00:00.000Z,2026-12-10,2026-12-15,2026-12-09,2026-12-16,2026-12-09,2026-12-16',
      'providers.csv': 'id,name,status,allowed_currencies,created_at,commission_rate,gross_commission_mode,default_gross_rate,commission_due_days,contact_name,phone,email,internal_note,references,service_types\nprovider-1,Proveedor completo,active,USD|MXN,2026-08-20T00:00:00.000Z,0.8,fixed_percentage,0.12,30,Andrea,+50761111111,provider@example.test,Nota,REF-1|REF-2,Hotel|Crucero',
      'services.csv': 'id,trip_id,name,status,created_at,start_on,end_on\nservice-1,trip-1,Hotel,active,2026-08-20T00:00:00.000Z,2026-12-10,2026-12-15',
      'service_providers.csv': 'id,service_id,provider_id,currency,commission_status,created_at,sale_amount,customer_balance_due_on,variable_gross_commission_amount\ncomponent-1,service-1,provider-1,USD,with_commission,2026-08-20T00:00:00.000Z,2500,2026-11-01,300',
      'provider_task_templates.csv': 'id,provider_id,title,required,relative_to,active,created_at,offset_days\ntemplate-1,provider-1,Confirmar,false,trip_start,true,2026-08-20T00:00:00.000Z,-7',
      'commissions.csv': 'id,trip_id,provider_id,service_provider_id,expected_amount,expected_currency,status,created_at,gross_amount,gross_currency,gross_commission_mode,gross_rate,agency_share_rate,due_on,tracking_reference,received_amount,received_currency,paid_on,payment_note\ncommission-1,trip-1,provider-1,component-1,240,USD,paid,2026-08-20T00:00:00.000Z,300,USD,fixed_percentage,0.12,0.8,2027-01-15,TRACK-1,235,USD,2027-01-16,Ajuste',
      'tasks.csv': 'id,title,required,status,lead_id,trip_id,service_provider_id,template_id,created_at,due_on,completed_at\ntask-1,Confirmar,false,completed,lead-1,trip-1,component-1,template-1,2026-08-20T00:00:00.000Z,2026-11-01,2026-11-01T12:00:00.000Z',
      'notes.csv': 'id,owner_type,owner_id,content,updated_at\nnote-1,trip,trip-1,Nota importada,2026-08-20T00:00:00.000Z',
      'payments.csv': 'id,trip_id,amount,amount_currency,occurred_at,recorded_at,status,source,service_provider_id\npayment-1,trip-1,100,USD,2026-08-20T00:00:00.000Z,2026-08-20T00:00:00.000Z,received,customer_payment,component-1',
      'activity_events.csv': 'id,aggregate_type,aggregate_id,type,occurred_at,recorded_at,payload_json\nevent-1,trip,trip-1,trip_imported,2026-08-20T00:00:00.000Z,2026-08-20T00:00:00.000Z,{"source":"import"}',
    });

    await applyCsvImport(await previewCsvPackage(file, repository), repository);
    const snapshot = await repository.snapshot();

    expect(snapshot).toMatchObject({
      leads: [expect.objectContaining({ referredBy: 'Ana', budget: { amount: 2500, currency: 'USD' } })],
      clients: [expect.objectContaining({ familyNote: 'Prefieren habitaciones conectadas' })],
      trips: [expect.objectContaining({ overrideStartOn: '2026-12-09', effectiveEndOn: '2026-12-16' })],
      providers: [expect.objectContaining({ contactName: 'Andrea', references: ['REF-1', 'REF-2'], serviceTypes: ['Hotel', 'Crucero'] })],
      services: [expect.objectContaining({ startOn: '2026-12-10', endOn: '2026-12-15' })],
      serviceProviders: [expect.objectContaining({ saleAmount: 2500, customerBalanceDueOn: '2026-11-01', variableGrossCommissionAmount: 300 })],
      providerTaskTemplates: [expect.objectContaining({ offsetDays: -7 })],
      commissions: [expect.objectContaining({ grossAmount: { amount: 300, currency: 'USD' }, received: { amount: 235, currency: 'USD' }, paymentNote: 'Ajuste' })],
      tasks: [expect.objectContaining({ leadId: 'lead-1', templateId: 'template-1', completedAt: '2026-11-01T12:00:00.000Z' })],
      payments: [expect.objectContaining({ serviceProviderId: 'component-1' })],
    });
  });

  it('preserves the corrective closure fields in an additive synthetic CSV package', async () => {
    const repository = new MemoryWorkspaceRepository();
    const file = await packageFile({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at,communication_channel,commercial_note\nlead-1,Familia cierre,Web,dates_to_define,sold,2026-09-05T00:00:00.000Z,WhatsApp,Aniversario íntimo',
      'clients.csv': 'id,name,created_at,address\nclient-1,Familia cierre,2026-09-05T00:00:00.000Z,Calle Prueba 1',
      'trips.csv': 'id,lead_id,client_id,status,created_at,reference_rate_base_currency,reference_rate_quote_currency,reference_exchange_rate,reference_exchange_rate_locked_at\ntrip-1,lead-1,client-1,active,2026-09-05T00:00:00.000Z,USD,MXN,18.5,2026-09-05T10:00:00.000Z',
      'providers.csv': 'id,name,status,allowed_currencies,created_at\nprovider-1,Proveedor cierre,active,USD,2026-09-05T00:00:00.000Z',
      'services.csv': 'id,trip_id,name,status,created_at\nservice-1,trip-1,Hotel,active,2026-09-05T00:00:00.000Z',
      'service_providers.csv': 'id,service_id,provider_id,currency,commission_status,created_at,cancellation_outcome,cancelled_at\ncomponent-1,service-1,provider-1,USD,with_commission,2026-09-05T00:00:00.000Z,partial,2026-09-05T11:00:00.000Z',
      'commissions.csv': 'id,trip_id,provider_id,service_provider_id,expected_amount,expected_currency,status,created_at,projection_rate_base_currency,projection_rate_quote_currency,projection_exchange_rate,projection_rate_source,projected_reference_amount,projected_reference_currency\ncommission-1,trip-1,provider-1,component-1,100,USD,expected,2026-09-05T00:00:00.000Z,USD,MXN,19,commission_override,1900,MXN',
      'tasks.csv': 'id,title,required,status,created_at,due_on,due_time,commission_id,source,due_date_source\ntask-1,Revisar comisión,false,open,2026-09-05T00:00:00.000Z,2026-09-06,09:30,commission-1,manual,manual',
    });

    await applyCsvImport(await previewCsvPackage(file, repository), repository);
    const snapshot = await repository.snapshot();

    expect(snapshot).toMatchObject({
      leads: [expect.objectContaining({ communicationChannel: 'WhatsApp', commercialNote: 'Aniversario íntimo' })],
      clients: [expect.objectContaining({ address: 'Calle Prueba 1' })],
      trips: [expect.objectContaining({ referenceExchangeRate: 18.5, referenceExchangeRateLockedAt: '2026-09-05T10:00:00.000Z' })],
      serviceProviders: [expect.objectContaining({ cancellationOutcome: 'partial', cancelledAt: '2026-09-05T11:00:00.000Z' })],
      commissions: [expect.objectContaining({ projectionRateSource: 'commission_override', projectionExchangeRate: 19, projectedReferenceAmount: { amount: 1900, currency: 'MXN' } })],
      tasks: [expect.objectContaining({ dueTime: '09:30', commissionId: 'commission-1', source: 'manual' })],
    });
  });
});
