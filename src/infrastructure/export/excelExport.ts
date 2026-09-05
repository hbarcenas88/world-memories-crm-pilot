import writeXlsxFile, { type Sheet } from 'write-excel-file/browser';
import type { WorkspaceSnapshot } from '../../application/workspaceSnapshot';

type SheetRow = (string | number | undefined)[];
function sheet(name: string, header: readonly string[], rows: readonly SheetRow[]): Sheet<Blob> { return { sheet: name, data: [header.map((value) => ({ value, fontWeight: 'bold' })), ...rows], columns: header.map(() => ({ width: 22 })) }; }

export async function exportOperationalExcel(workspace: WorkspaceSnapshot): Promise<Blob> {
  const output = writeXlsxFile([
    sheet('Leads', ['ID', 'Nombre', 'Origen', 'Canal', 'Destino', 'Nota comercial', 'Estado', 'Creado'], workspace.leads.map((lead) => [lead.id, lead.name, lead.acquisitionSource, lead.communicationChannel, lead.destination, lead.commercialNote, lead.status, lead.createdAt])),
    sheet('Clientes', ['ID', 'Nombre', 'País', 'Dirección', 'Teléfono', 'Correo', 'Creado'], workspace.clients.map((client) => [client.id, client.name, client.residenceCountry, client.address, client.phone, client.email, client.createdAt])),
    sheet('Viajes', ['ID', 'Lead', 'Cliente', 'Estado', 'Inicio efectivo', 'Fin efectivo', 'Moneda base', 'Moneda cotizada', 'Tasa de referencia', 'Tasa congelada'], workspace.trips.map((trip) => [trip.id, trip.leadId, trip.clientId, trip.status, trip.effectiveStartOn, trip.effectiveEndOn, trip.referenceRateBaseCurrency, trip.referenceRateQuoteCurrency, trip.referenceExchangeRate, trip.referenceExchangeRateLockedAt])),
    sheet('Servicios', ['ID', 'Viaje', 'Nombre', 'Estado', 'Inicio', 'Fin'], workspace.services.map((service) => [service.id, service.tripId, service.name, service.status, service.startOn, service.endOn])),
    sheet('Componentes de proveedor', ['ID', 'Servicio', 'Proveedor', 'Moneda', 'Importe de venta', 'Localizador', 'Comisión', 'Resultado de cancelación', 'Cancelado'], workspace.serviceProviders.map((component) => [component.id, component.serviceId, component.providerId, component.currency, component.saleAmount, component.reservationLocator, component.commissionStatus, component.cancellationOutcome, component.cancelledAt])),
    sheet('Conceptos adicionales', ['ID', 'Servicio', 'Concepto', 'Importe', 'Moneda'], workspace.serviceAdditionalItems.map((item) => [item.id, item.serviceId, item.label, item.amount, item.currency])),
    sheet('Comisiones', ['ID', 'Viaje', 'Proveedor', 'Estado', 'Esperado', 'Moneda', 'Fecha esperada', 'Tasa base', 'Tasa cotizada', 'Tasa de proyección', 'Origen de tasa', 'Importe de referencia'], workspace.commissions.map((commission) => [commission.id, commission.tripId, commission.providerId, commission.status, commission.expected.amount, commission.expected.currency, commission.dueOn, commission.projectionRateBaseCurrency, commission.projectionRateQuoteCurrency, commission.projectionExchangeRate, commission.projectionRateSource, commission.projectedReferenceAmount?.amount])),
    sheet('Tareas', ['ID', 'Título', 'Estado', 'Vence', 'Hora', 'Lead', 'Viaje', 'Comisión', 'Origen'], workspace.tasks.map((task) => [task.id, task.title, task.status, task.dueOn, task.dueTime, task.leadId, task.tripId, task.commissionId, task.source])),
  ]);
  return output.toBlob();
}
