import { CheckCircle2, Clock3, Send, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { formatOperationalDate, formatOperationalDateTime } from '../../domain/operationalDate';
import type { ActivityEvent, CatalogEntry, Client, Lead, LeadStatus, Task } from '../../domain/types';
import { LeadConversionForm } from './LeadConversionForm';

const eventKeys: Record<string, import('../../app/i18n').TranslationKey> = { lead_received: 'leadReceived', lead_contacted: 'leadContacted', quote_sent: 'quoteSent', lead_follow_up: 'leadFollowUp', lead_review_adjustments: 'leadReviewAdjustments', lead_paused: 'leadPaused', lead_cancelled: 'leadCancelled', lead_converted: 'leadConverted' };
const actionKeys: Partial<Record<LeadStatus, Readonly<{ label: import('../../app/i18n').TranslationKey; to: LeadStatus }>>> = { contacted: { label: 'prepareQuote', to: 'quote_preparing' }, quote_preparing: { label: 'markQuoteSent', to: 'quote_sent' }, quote_sent: { label: 'recordFollowUp', to: 'follow_up' }, follow_up: { label: 'recordAdjustments', to: 'review_adjustments' }, review_adjustments: { label: 'resendQuote', to: 'quote_sent' }, paused: { label: 'reactivateFollowUp', to: 'follow_up' }, cancelled: { label: 'reactivateFollowUp', to: 'follow_up' } };
const leadStatusKeys: Record<LeadStatus, import('../../app/i18n').TranslationKey> = { new: 'leadReceived', contacted: 'leadContacted', quote_preparing: 'prepareQuote', quote_sent: 'quoteSent', follow_up: 'leadFollowUp', review_adjustments: 'leadReviewAdjustments', paused: 'leadPaused', sold: 'leadConverted', cancelled: 'leadCancelled' };
type TransitionPayload = Readonly<{ cancellationReasonId?: string; cancellationReasonNote?: string; createPausedFollowUp?: boolean }>;
type Props = Readonly<{ lead: Lead; clients: readonly Client[]; events: readonly ActivityEvent[]; tasks: readonly Task[]; cancellationReasons?: readonly CatalogEntry[]; onCreateCancellationReason?: (label: string) => Promise<CatalogEntry>; onTransition: (to: LeadStatus, payload?: TransitionPayload) => void; onConvert: (payment: { amount: number; currency: 'USD' | 'MXN'; clientId?: string; primaryMemberId?: string }) => void; onCompleteTask: (taskId: string) => void; onRescheduleTask: (taskId: string, dueOn: string) => void; onClose: () => void; onOpenWorkspace?: () => void; recordActions?: ReactNode }>;

export function LeadDetail({ lead, clients, events, tasks, cancellationReasons = [], onCreateCancellationReason, onTransition, onConvert, onCompleteTask, onRescheduleTask, onClose, onOpenWorkspace, recordActions }: Props) {
  const locale = useLocale();
  const action = actionKeys[lead.status];
  const [showConversion, setShowConversion] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showPauseSuggestion, setShowPauseSuggestion] = useState(false);
  const [cancellationReasonId, setCancellationReasonId] = useState(lead.cancellationReasonId ?? '');
  const [cancellationReasonNote, setCancellationReasonNote] = useState(lead.cancellationReasonNote ?? '');
  const [newCancellationReason, setNewCancellationReason] = useState('');
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  const canEndLead = lead.status !== 'sold' && lead.status !== 'cancelled';
  async function addCancellationReason(): Promise<void> {
    const value = newCancellationReason.trim();
    if (!value || !onCreateCancellationReason) return;
    const existing = cancellationReasons.find((reason) => reason.label.localeCompare(value, undefined, { sensitivity: 'accent' }) === 0);
    const reason = existing ?? await onCreateCancellationReason(value);
    setCancellationReasonId(reason.id);
    setNewCancellationReason('');
  }
  return <aside className="lead-detail" aria-label={label('leadDetails')}>
    <div className="detail-header"><div><p className="detail-status">{label(leadStatusKeys[lead.status])}</p><h2>{lead.name || label('unnamedLead')}</h2></div><div className="detail-header-actions">{onOpenWorkspace && <button className="secondary-button" onClick={onOpenWorkspace} type="button">{label('openFullWorkspace')}</button>}{recordActions}<button className="icon-button" aria-label={label('closeDetails')} onClick={onClose} type="button"><X aria-hidden="true" /></button></div></div>
    <dl className="detail-facts"><div><dt>{label('source')}</dt><dd>{lead.acquisitionSource || label('undefinedValue')}</dd></div><div><dt>{label('destination')}</dt><dd>{lead.destination || label('undefinedValue')}</dd></div><div><dt>{label('dates')}</dt><dd>{lead.requestedDateStatus === 'dates_to_define' ? label('datesToDefine') : label('datesKnown')}</dd></div></dl>
    {action && <button className="primary-button detail-action" onClick={() => onTransition(action.to)} type="button">{action.to === 'quote_sent' ? <Send aria-hidden="true" size={17} /> : <CheckCircle2 aria-hidden="true" size={17} />}{label(action.label)}</button>}
    {canEndLead && <div className="detail-actions"><button className="secondary-button" onClick={() => setShowPauseSuggestion(true)} type="button">{label('pauseLead')}</button><button className="secondary-button" onClick={() => setShowCancellation(true)} type="button">{label('cancelLead')}</button></div>}
    {showPauseSuggestion && <section className="detail-section" aria-label={label('pauseLead')}><p className="muted-copy">{label('pauseLeadSuggestion')}</p><div className="form-actions"><button className="secondary-button" onClick={() => onTransition('paused')} type="button">{label('pauseWithoutTask')}</button><button className="primary-button" onClick={() => onTransition('paused', { createPausedFollowUp: true })} type="button">{label('pauseWithTask')}</button></div></section>}
    {showCancellation && <section className="detail-section" aria-label={label('cancelLead')}><h3>{label('cancelLead')}</h3><p className="muted-copy">{label('cancelLeadDescription')}</p><label>{label('cancellationReason')}<select aria-label={label('cancellationReason')} onChange={(event) => setCancellationReasonId(event.target.value)} value={cancellationReasonId}><option value="">{label('selectIfKnown')}</option>{cancellationReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.label}</option>)}</select></label>{onCreateCancellationReason && <div className="inline-add"><label>{label('newCancellationReason')}<input aria-label={label('newCancellationReason')} onChange={(event) => setNewCancellationReason(event.target.value)} value={newCancellationReason} /></label><button className="text-button" onClick={() => { void addCancellationReason(); }} type="button">{label('addCancellationReason')}</button></div>}<label>{label('cancellationNote')}<textarea aria-label={label('cancellationNote')} onChange={(event) => setCancellationReasonNote(event.target.value)} value={cancellationReasonNote} /></label><div className="form-actions"><button className="secondary-button" onClick={() => setShowCancellation(false)} type="button">{label('cancel')}</button><button className="primary-button" onClick={() => onTransition('cancelled', { ...(cancellationReasonId ? { cancellationReasonId } : {}), ...(cancellationReasonNote ? { cancellationReasonNote } : {}) })} type="button">{label('confirmCancellation')}</button></div></section>}
    {['quote_sent', 'follow_up', 'review_adjustments'].includes(lead.status) && !showConversion && <button className="secondary-button conversion-trigger" onClick={() => setShowConversion(true)} type="button">{label('recordFirstPayment')}</button>}
    {showConversion && <LeadConversionForm clients={clients} linkedClientId={lead.clientId} onCancel={() => setShowConversion(false)} onConfirm={(payment) => { onConvert(payment); setShowConversion(false); }} />}
    <section className="detail-section"><h3>{label('activity')}</h3><ol className="timeline">{events.map((event) => <li key={event.id}><Clock3 aria-hidden="true" size={17} /><div><strong>{eventKeys[event.type] ? label(eventKeys[event.type]) : event.type}</strong><span>{formatOperationalDateTime(event.occurredAt)}</span></div></li>)}</ol></section>
    <section className="detail-section"><h3>{label('tasks')}</h3>{tasks.length === 0 ? <p className="muted-copy">{label('noOpenTasks')}</p> : <ul className="task-list">{tasks.map((task) => <li key={task.id}><div><span>{task.title}</span><small>{task.dueOn ? formatOperationalDate(task.dueOn) : label('undated')}</small></div>{task.status === 'open' && <div className="task-actions"><OperationalDateField aria-label={t('newDateFor', locale, { task: task.title })} onChange={(dueOn) => { if (dueOn) onRescheduleTask(task.id, dueOn); }} value={task.dueOn} /><button className="secondary-button" onClick={() => onCompleteTask(task.id)} type="button">{label('complete')}</button></div>}{task.status === 'completed' && <small>{label('completed')}</small>}</li>)}</ul>}</section>
  </aside>;
}
