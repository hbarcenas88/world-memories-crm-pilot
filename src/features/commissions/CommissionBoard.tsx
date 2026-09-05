import { useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import { formatOperationalDate, formatOperationalNumber } from '../../domain/operationalDate';
import type { ManagedRecordRef, RecordImpact } from '../../application/recordImpact';
import { ArchiveFilterChips, type ArchiveFilter } from '../../design/components/ArchiveFilterChips';
import type { Commission, Provider } from '../../domain/types';
import { EmptyState } from '../../design/components/EmptyState';
import { RecordActions } from '../records/RecordActions';

type CommissionGroup = 'expected' | 'upcoming' | 'overdue' | 'paid';

function groupCommissions(commissions: readonly Commission[], today: string): Readonly<Record<CommissionGroup, readonly Commission[]>> {
  const groups: Record<CommissionGroup, Commission[]> = { expected: [], upcoming: [], overdue: [], paid: [] };
  for (const commission of commissions) {
    if (commission.status === 'paid') groups.paid.push(commission);
    else if (commission.status === 'cancelled') continue;
    else if (!commission.dueOn) groups.expected.push(commission);
    else if (commission.dueOn < today) groups.overdue.push(commission);
    else groups.upcoming.push(commission);
  }
  return groups;
}

type CommissionBoardProps = Readonly<{
  commissions: readonly Commission[];
  providers: readonly Provider[];
  onMarkPaid: (commission: Commission) => void;
  onUpdateTracking?: (commissionId: string, trackingReference: string) => Promise<void>;
  loadImpact?: (target: ManagedRecordRef) => Promise<RecordImpact>;
  onArchive?: (target: ManagedRecordRef) => void;
  onDelete?: (target: ManagedRecordRef) => void;
  onOpenWorkspace?: (commission: Commission) => void;
  onRestore?: (target: ManagedRecordRef) => void;
  today?: string;
}>;

export function CommissionBoard({ commissions, providers, onMarkPaid, onUpdateTracking = async () => undefined, loadImpact, onArchive, onDelete, onOpenWorkspace, onRestore, today = new Date().toISOString().slice(0, 10) }: CommissionBoardProps) {
  const [trackingDrafts, setTrackingDrafts] = useState<Readonly<Record<string, string>>>({});
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const locale = useLocale();
  if (commissions.length === 0) return <EmptyState title={t('noCommissions', locale)} body={t('noCommissionsDescription', locale)} />;
  const providerNames = new Map(providers.map((provider) => [provider.id, provider.name]));
  const visibleCommissions = commissions.filter((commission) => archiveFilter === 'all' || (archiveFilter === 'archived' ? Boolean(commission.archivedAt) : !commission.archivedAt));
  const totalsByCurrency = new Map<string, { expected: number; received: number }>();
  for (const commission of visibleCommissions) {
    if (commission.status === 'cancelled') continue;
    const expected = totalsByCurrency.get(commission.expected.currency) ?? { expected: 0, received: 0 };
    expected.expected += commission.expected.amount;
    totalsByCurrency.set(commission.expected.currency, expected);
    if (commission.received) {
      const received = totalsByCurrency.get(commission.received.currency) ?? { expected: 0, received: 0 };
      received.received += commission.received.amount;
      totalsByCurrency.set(commission.received.currency, received);
    }
  }
  const groups = groupCommissions(visibleCommissions, today);
  const renderGroup = (title: string, items: readonly Commission[], isOverdue = false) => <section aria-label={title} className="commission-group"><h2>{title}</h2>{items.length === 0 ? <p className="muted-copy">{t('noCommissionsInGroup', locale)}</p> : <div className="lead-table"><div className="lead-table-header"><span>{t('provider', locale)}</span><span>{t('expected', locale)}</span><span>{t('expectedDate', locale)}</span><span>{t('trackingForm', locale)}</span><span>{t('status', locale)}</span></div>{items.map((commission) => {
    const providerName = providerNames.get(commission.providerId) ?? t('noProvider', locale);
    const archived = Boolean(commission.archivedAt);
    return <div className="lead-row" key={commission.id}><strong>{providerName}</strong><span>{formatOperationalNumber(commission.expected.amount)} {commission.expected.currency}</span><span>{commission.dueOn ? formatOperationalDate(commission.dueOn) : t('undated', locale)}</span><span>{archived ? commission.trackingReference ?? t('notRegistered', locale) : <><input aria-label={`${t('trackingForm', locale)} ${commission.id}`} onChange={(event) => setTrackingDrafts((current) => ({ ...current, [commission.id]: event.target.value }))} value={trackingDrafts[commission.id] ?? commission.trackingReference ?? ''} /><button className="text-button" disabled={(trackingDrafts[commission.id] ?? commission.trackingReference ?? '').trim() === ''} onClick={() => { void onUpdateTracking(commission.id, trackingDrafts[commission.id] ?? commission.trackingReference ?? ''); }} type="button">{t('saveTracking', locale)}</button></>}</span><span>{onOpenWorkspace && <button className="text-button" onClick={() => onOpenWorkspace(commission)} type="button">{t('openFullWorkspaceFor', locale, { record: providerName })}</button>}{commission.status === 'paid' ? t('paid', locale) : !archived && <button className="secondary-button" onClick={() => onMarkPaid(commission)} type="button">{t('recordCommissionPayment', locale)}</button>}{isOverdue && <small>{t('internalCommissionFollowUp', locale)}</small>}{loadImpact && onArchive && onDelete && <RecordActions archived={archived} label={t('recordActionsCommission', locale, { provider: providerName })} loadImpact={loadImpact} onArchive={onArchive} onDelete={onDelete} onRestore={onRestore} target={{ kind: 'commission', id: commission.id }} />}</span></div>;
  })}</div>}</section>;
  return <section aria-label={t('commissionBoard', locale)} className="commission-board"><ArchiveFilterChips onChange={setArchiveFilter} value={archiveFilter} /><section aria-label={t('commissionTotalsByCurrency', locale)} className="detail-section"><h2>{t('commissionTotalsByCurrency', locale)}</h2><dl className="detail-summary">{[...totalsByCurrency.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([currency, total]) => <div key={currency}><dt>{currency}</dt><dd>{t('expected', locale)}: {formatOperationalNumber(total.expected)} {currency} · {t('receivedAmount', locale)}: {formatOperationalNumber(total.received)} {currency}</dd></div>)}</dl></section>{renderGroup(t('expectedCommissions', locale), groups.expected)}{renderGroup(t('upcomingCommissions', locale), groups.upcoming)}{renderGroup(t('overdueCommissions', locale), groups.overdue, true)}{renderGroup(t('paidCommissions', locale), groups.paid)}</section>;
}
