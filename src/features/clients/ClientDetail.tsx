import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { ageAtDate } from '../../domain/dates';
import { formatOperationalDate, formatOperationalDateTime } from '../../domain/operationalDate';
import type { ActivityEvent, Client, Lead, Trip } from '../../domain/types';

type ClientDetailProps = Readonly<{
  client: Client;
  trips: readonly Trip[];
  leads?: readonly Lead[];
  events: readonly ActivityEvent[];
  onOpenTrip: (trip: Trip) => void;
  onOpenLead?: (lead: Lead) => void;
  onClose: () => void;
  onOpenWorkspace?: () => void;
  recordActions?: ReactNode;
}>;

const eventKeys: Record<string, import('../../app/i18n').TranslationKey> = {
  quote_sent: 'quoteSent', customer_payment_recorded: 'customerPaymentRecorded', trip_created: 'tripCreated', lead_converted: 'leadConverted', client_workspace_saved: 'clientWorkspaceSaved', trip_workspace_saved: 'tripWorkspaceSaved',
};

export function ClientDetail({ client, trips, leads = [], events, onOpenTrip, onOpenLead, onClose, onOpenWorkspace, recordActions }: ClientDetailProps) {
  const locale = useLocale();
  const label = (key: import('../../app/i18n').TranslationKey, variables?: Record<string, string | number>) => t(key, locale, variables);
  const timeline = [...events].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const today = new Date().toISOString().slice(0, 10);

  return <aside aria-label={label('clientWorkspace')} className="client-detail">
    <div className="detail-header"><div><p className="detail-status">{label('clientFamily')}</p><h2>{client.name}</h2></div><div className="detail-header-actions">{onOpenWorkspace && <button className="secondary-button" onClick={onOpenWorkspace} type="button">{label('openFullWorkspace')}</button>}{recordActions}<button aria-label={label('closeClient')} className="icon-button" onClick={onClose} type="button"><X aria-hidden="true" /></button></div></div>
    <section className="detail-section"><h3>{label('contact')}</h3><p>{client.phone || client.email || client.residenceCountry || client.address ? <>{client.phone && <>{client.phone} </>}{client.email && <>{client.email} </>}{client.residenceCountry && <>{client.residenceCountry} </>}{client.address && <>{client.address}</>}</> : label('undefinedValue')}</p></section>
    <section className="detail-section"><h3>{label('usefulNote')}</h3><p>{client.familyNote || label('noUsefulNote')}</p></section>
    <section className="detail-section"><h3>{label('members')}</h3>{(client.members?.length ?? 0) === 0 ? <p className="muted-copy">{label('noMembers')}</p> : <ul className="member-list">{client.members?.map((member) => <li className="member-row" key={member.id}><strong>{member.name}</strong>{member.relationship && <small>{member.relationship}</small>}{member.birthDate && <small>{formatOperationalDate(member.birthDate)}</small>}{member.birthDate && <small>{label('currentAge', ageAtDate(member.birthDate, today))}</small>}{member.status === 'archived' && <span className="archived-label">{label('archivedRecord')}</span>}</li>)}</ul>}</section>
    <section className="detail-section"><h3>{label('linkedLeads')}</h3>{leads.length === 0 ? <p className="muted-copy">{label('noLinkedLeads')}</p> : <ul className="client-trip-list">{leads.map((lead) => <li key={lead.id}><span>{lead.name}</span>{onOpenLead && <button className="text-button" onClick={() => onOpenLead(lead)} type="button">{label('open')}</button>}</li>)}</ul>}</section>
    <section className="detail-section"><h3>{label('linkedTrips')}</h3>{trips.length === 0 ? <p className="muted-copy">{label('noLinkedTrips')}</p> : <ul className="client-trip-list">{trips.map((trip) => <li key={trip.id}><span>{trip.effectiveStartOn && trip.effectiveEndOn ? `${formatOperationalDate(trip.effectiveStartOn)} — ${formatOperationalDate(trip.effectiveEndOn)}` : label('clientDatesToDefine')}</span><button className="text-button" onClick={() => onOpenTrip(trip)} type="button">{label('openTrip')}</button></li>)}</ul>}</section>
    <section className="detail-section"><h3>{label('aggregateHistory')}</h3>{timeline.length === 0 ? <p className="muted-copy">{label('noLinkedEvents')}</p> : <ol className="timeline">{timeline.map((event) => <li key={event.id}><span aria-hidden="true">●</span><div><strong>{eventKeys[event.type] ? label(eventKeys[event.type]) : event.type}</strong><small>{event.aggregateType === 'lead' ? label('lead') : event.aggregateType === 'trip' ? label('trip') : label('client')} · {formatOperationalDateTime(event.occurredAt)}</small></div></li>)}</ol>}</section>
  </aside>;
}
