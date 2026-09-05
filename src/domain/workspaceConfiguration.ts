import type { CatalogEntry, GlobalCatalogKey, WorkspaceConfiguration } from './types';

const entry = (id: string, label: string): CatalogEntry => ({ id, label, active: true });

export const globalCatalogLabels: Readonly<Record<GlobalCatalogKey, string>> = {
  travelTypes: 'Tipos de viaje',
  acquisitionSources: 'Fuentes de adquisición',
  communicationChannels: 'Canales de comunicación',
  cancellationReasons: 'Motivos de cancelación',
  familyRelationships: 'Relaciones familiares',
};

const defaults: Readonly<Record<GlobalCatalogKey, readonly CatalogEntry[]>> = {
  travelTypes: [
    entry('travel-tour', 'Tour'), entry('travel-hotel', 'Hotel'), entry('travel-disney', 'Paquete Disney'), entry('travel-universal', 'Paquete Universal'), entry('travel-palace', 'Palace Group'), entry('travel-custom', 'Viaje personalizado'), entry('travel-cruise', 'Crucero'), entry('travel-car-rental', 'Renta auto'), entry('travel-experiences', 'Boletos experiencias'), entry('travel-expedia', 'Paquete Expedia'), entry('travel-external-operator', 'Operador fuera de Archer'), entry('travel-flight-hotel', 'Vuelo + hotel'), entry('travel-park-tickets', 'Tickets parque'), entry('travel-insurance', 'Seguro viaje'), entry('travel-flight-ticketing', 'Emisión boletos vuelos'),
  ],
  acquisitionSources: [entry('source-friends-family', 'Friends & Family'), entry('source-facebook', 'Facebook'), entry('source-referral', 'Referido'), entry('source-whatsapp', 'WhatsApp'), entry('source-instagram', 'Instagram'), entry('source-personal-trip', 'Viaje personal'), entry('source-client', 'Cliente')],
  communicationChannels: [],
  cancellationReasons: [],
  familyRelationships: [entry('relationship-partner', 'Pareja'), entry('relationship-mother', 'Madre'), entry('relationship-father', 'Padre'), entry('relationship-son', 'Hijo'), entry('relationship-daughter', 'Hija'), entry('relationship-other', 'Otro')],
};

export function createDefaultWorkspaceConfiguration(updatedAt = new Date().toISOString()): WorkspaceConfiguration {
  return { id: 'workspace-configuration', locale: 'es', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: '1,234.56', catalogs: defaults, updatedAt };
}

export function activeCatalogEntries(configuration: WorkspaceConfiguration, catalog: GlobalCatalogKey): readonly CatalogEntry[] {
  return configuration.catalogs[catalog].filter((entry) => entry.active);
}
