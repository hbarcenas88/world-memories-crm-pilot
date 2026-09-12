import { MapPinned } from 'lucide-react';
import { useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { formatOperationalDate, formatOperationalDateTime } from '../../domain/operationalDate';
import { ArchiveFilterChips, type ArchiveFilter } from '../../design/components/ArchiveFilterChips';
import type { Client, DeletedRecordReference, Trip } from '../../domain/types';
import { resolveRecordReference } from '../../domain/recordReference';
import { EmptyState } from '../../design/components/EmptyState';
import { FilterBar } from '../../design/components/FilterBar';

const tripStatusKeys: Record<Trip['status'], import('../../app/i18n').TranslationKey> = { active: 'tripActive', completed: 'tripCompleted', cancelled: 'tripCancelled' };

export function TripList({ trips, clients, deletedReferences = [], onSelect }: { trips: readonly Trip[]; clients: readonly Client[]; deletedReferences?: readonly DeletedRecordReference[]; onSelect: (trip: Trip) => void }) {
  const locale = useLocale();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [status, setStatus] = useState<'all' | Trip['status']>('all');
  const [clientId, setClientId] = useState('');
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  if (trips.length === 0) return <EmptyState title={label('noTrips')} body={label('noTripsDescription')} />;
  const filteredTrips = trips.filter((trip) => {
    const visibleByArchive = archiveFilter === 'all' || (archiveFilter === 'archived' ? Boolean(trip.archivedAt) : !trip.archivedAt);
    const visibleByStatus = status === 'all' || trip.status === status;
    const visibleByClient = clientId === '' || trip.clientId === clientId;
    const visibleByDate = (!from || (trip.effectiveEndOn ?? trip.effectiveStartOn ?? '') >= from) && (!to || (trip.effectiveStartOn ?? trip.effectiveEndOn ?? '') <= to);
    return visibleByArchive && visibleByStatus && visibleByClient && visibleByDate;
  });
  const clientLabel = (clientId: string): string => {
    const resolved = resolveRecordReference(clients, deletedReferences, 'client', clientId);
    return resolved.state === 'live' ? resolved.record.name : resolved.state === 'deleted' ? t('deletedRecordReference', locale, { record: resolved.reference.displayLabel }) : label('unnamedClient');
  };
  return <div className="lead-layout">
    <ArchiveFilterChips onChange={setArchiveFilter} value={archiveFilter} />
    <FilterBar label={label('tripFilters')} onClear={() => { setStatus('all'); setClientId(''); setFrom(undefined); setTo(undefined); }}><div className="form-grid task-filters">
      <label>{label('tripStatus')}<select aria-label={label('tripStatus')} onChange={(event) => setStatus(event.target.value as 'all' | Trip['status'])} value={status}><option value="all">{label('allStatuses')}</option>{Object.entries(tripStatusKeys).map(([value, key]) => <option key={value} value={value}>{label(key)}</option>)}</select></label>
      <label>{label('tripClient')}<select aria-label={label('tripClient')} onChange={(event) => setClientId(event.target.value)} value={clientId}><option value="">{label('allTrips')}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label>{label('fromDate')}<OperationalDateField aria-label={label('fromDate')} onChange={setFrom} value={from} /></label>
      <label>{label('toDate')}<OperationalDateField aria-label={label('toDate')} onChange={setTo} value={to} /></label>
    </div></FilterBar>
    {filteredTrips.length === 0 ? <EmptyState title={label('noRecordsInFilter')} body={label('changeTripFilter')} /> : <section className="lead-table" aria-label={label('tripList')}><div className="lead-table-header"><span>{label('client')}</span><span>{label('effectivePeriod')}</span><span>{label('status')}</span><span>{label('lastSaved')}</span></div>{filteredTrips.map((trip) => <button className="lead-row" key={trip.id} onClick={() => onSelect(trip)} type="button"><strong><MapPinned aria-hidden="true" size={16} /> {clientLabel(trip.clientId)}</strong><span>{trip.effectiveStartOn && trip.effectiveEndOn ? `${formatOperationalDate(trip.effectiveStartOn)} — ${formatOperationalDate(trip.effectiveEndOn)}` : label('clientDatesToDefine')}</span><span>{trip.archivedAt ? <span className="status-chip">{label('archivedRecord')}</span> : label(tripStatusKeys[trip.status])}</span><span>{trip.lastSavedAt ? formatOperationalDateTime(trip.lastSavedAt) : '—'}</span></button>)}</section>}
  </div>;
}
