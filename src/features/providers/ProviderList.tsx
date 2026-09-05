import { Landmark } from 'lucide-react';
import { useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import { ArchiveFilterChips, type ArchiveFilter } from '../../design/components/ArchiveFilterChips';
import type { Provider } from '../../domain/types';
import { EmptyState } from '../../design/components/EmptyState';

export function ProviderList({ providers, onSelect }: { providers: readonly Provider[]; onSelect: (provider: Provider) => void }) {
  const locale = useLocale();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [serviceType, setServiceType] = useState('');
  const [query, setQuery] = useState('');
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  if (providers.length === 0) return <EmptyState title={label('noProviders')} body={label('noProvidersDescription')} />;
  const serviceTypes = [...new Set(providers.flatMap((provider) => provider.serviceTypes ?? []))].sort((left, right) => left.localeCompare(right));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredProviders = providers.filter((provider) => {
    const matchesArchive = archiveFilter === 'all' || archiveFilter === 'archived' ? Boolean(provider.archivedAt) : !provider.archivedAt;
    const matchesType = serviceType === '' || provider.serviceTypes?.includes(serviceType);
    const searchable = [provider.name, ...(provider.serviceTypes ?? [])].join(' ').toLocaleLowerCase();
    return matchesArchive && matchesType && (normalizedQuery === '' || searchable.includes(normalizedQuery));
  });

  return <div className="lead-layout">
    <ArchiveFilterChips onChange={setArchiveFilter} value={archiveFilter} />
    <div className="form-grid task-filters">
      <label>{label('searchProviders')}<input aria-label={label('searchProviders')} onChange={(event) => setQuery(event.target.value)} placeholder={label('searchProvidersPlaceholder')} value={query} /></label>
      <label>{label('providerServiceType')}<select aria-label={label('providerServiceType')} onChange={(event) => setServiceType(event.target.value)} value={serviceType}><option value="">{label('allServiceTypes')}</option>{serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
    </div>
    {filteredProviders.length === 0 ? <EmptyState title={label('noProvidersInFilter')} body={label('changeProviderFilter')} /> : <section className="lead-table" aria-label={label('providerList')}><div className="lead-table-header"><span>{label('provider')}</span><span>{label('allowedCurrencies')}</span><span>{label('commission')}</span><span>{label('status')}</span></div>{filteredProviders.map((provider) => <button className="lead-row" key={provider.id} onClick={() => onSelect(provider)} type="button"><strong><Landmark aria-hidden="true" size={16} /> {provider.name}</strong><span>{provider.allowedCurrencies.join(', ')}</span><span>{provider.commissionRate === undefined ? label('variable') : `${provider.commissionRate * 100}%`}</span><span>{provider.archivedAt ? <span className="status-chip">{label('archivedRecord')}</span> : provider.status === 'active' ? label('activeStatus') : label('inactiveStatus')}</span></button>)}</section>}
  </div>;
}
