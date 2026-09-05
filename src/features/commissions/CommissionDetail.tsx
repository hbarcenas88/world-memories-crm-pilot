import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Commission, Currency } from '../../domain/types';
import { formatOperationalDate, formatOperationalNumber } from '../../domain/operationalDate';

type CommissionDetailProps = Readonly<{
  commission: Commission;
  providerName: string;
  onMarkPaid: (commission: Commission) => void;
  onUpdateTracking: (commissionId: string, trackingReference: string) => Promise<void>;
  onUpdateProjectionRate?: (input: Readonly<{ commissionId: string; mode: 'override'; baseCurrency: Currency; quoteCurrency: Currency; exchangeRate: number }> | Readonly<{ commissionId: string; mode: 'follow_trip' }>) => Promise<void>;
  onOpenTrip?: () => void;
  onOpenProvider?: () => void;
  recordActions?: ReactNode;
}>;

export function CommissionDetail({ commission, providerName, onMarkPaid, onUpdateTracking, onUpdateProjectionRate, onOpenTrip, onOpenProvider, recordActions }: CommissionDetailProps) {
  const locale = useLocale();
  const [trackingReference, setTrackingReference] = useState(commission.trackingReference ?? '');
  const [projectionBaseCurrency, setProjectionBaseCurrency] = useState<Currency | ''>(commission.projectionRateBaseCurrency ?? '');
  const [projectionQuoteCurrency, setProjectionQuoteCurrency] = useState<Currency | ''>(commission.projectionRateQuoteCurrency ?? '');
  const [projectionExchangeRate, setProjectionExchangeRate] = useState(commission.projectionExchangeRate?.toString() ?? '');
  const archived = Boolean(commission.archivedAt);
  const status = commission.status === 'paid' ? t('paid', locale) : commission.status === 'cancelled' ? t('commissionCancelled', locale) : t('commissionExpected', locale);
  const amount = (value: { amount: number; currency: string }) => `${formatOperationalNumber(value.amount)} ${value.currency}`;
  function saveOwnProjectionRate(): void {
    const exchangeRate = Number(projectionExchangeRate);
    if (!onUpdateProjectionRate || !projectionBaseCurrency || !projectionQuoteCurrency || !Number.isFinite(exchangeRate) || exchangeRate <= 0) return;
    void onUpdateProjectionRate({ commissionId: commission.id, mode: 'override', baseCurrency: projectionBaseCurrency, quoteCurrency: projectionQuoteCurrency, exchangeRate });
  }
  return <section aria-label={t('commissionDetails', locale)} className="task-detail">
    <div className="detail-header"><div><p className="detail-status">{t('commission', locale)}</p><h2>{t('commissionDetails', locale)}</h2></div>{recordActions}</div>
    <dl className="detail-summary"><div><dt>{t('provider', locale)}</dt><dd>{providerName}</dd></div><div><dt>{t('expected', locale)}</dt><dd>{amount(commission.expected)}</dd></div><div><dt>{t('expectedDate', locale)}</dt><dd>{commission.dueOn ? formatOperationalDate(commission.dueOn) : t('undated', locale)}</dd></div><div><dt>{t('status', locale)}</dt><dd>{status}</dd></div>{commission.received && <div><dt>{t('receivedAmount', locale)}</dt><dd>{amount(commission.received)}</dd></div>}{commission.paidOn && <div><dt>{t('paymentEffectiveDate', locale)}</dt><dd>{formatOperationalDate(commission.paidOn)}</dd></div>}{commission.paymentNote && <div><dt>{t('differenceNote', locale)}</dt><dd>{commission.paymentNote}</dd></div>}{commission.projectedReferenceAmount && <div><dt>{t('projectedReferenceAmount', locale)}</dt><dd>{amount(commission.projectedReferenceAmount)}</dd></div>}</dl>
    {onUpdateProjectionRate && <section className="detail-section"><h3>{t('commissionProjectionRate', locale)}</h3><p className="muted-copy">{commission.projectionRateSource === 'commission_override' ? t('commissionUsesOwnRate', locale) : t('commissionFollowsTripRate', locale)}</p><div className="form-grid"><label>{t('referenceBaseCurrency', locale)}<select aria-label={t('referenceBaseCurrency', locale)} disabled={archived || commission.status !== 'expected'} onChange={(event) => setProjectionBaseCurrency(event.target.value as Currency | '')} value={projectionBaseCurrency}><option value="">{t('select', locale)}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label><label>{t('referenceQuoteCurrency', locale)}<select aria-label={t('referenceQuoteCurrency', locale)} disabled={archived || commission.status !== 'expected'} onChange={(event) => setProjectionQuoteCurrency(event.target.value as Currency | '')} value={projectionQuoteCurrency}><option value="">{t('select', locale)}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label><label>{t('ownProjectionRate', locale)}<input aria-label={t('ownProjectionRate', locale)} disabled={archived || commission.status !== 'expected'} inputMode="decimal" min="0" onChange={(event) => setProjectionExchangeRate(event.target.value)} step="0.0001" type="number" value={projectionExchangeRate} /></label></div><div className="form-actions">{commission.projectionRateSource === 'commission_override' && <button className="secondary-button" disabled={archived || commission.status !== 'expected'} onClick={() => { void onUpdateProjectionRate({ commissionId: commission.id, mode: 'follow_trip' }); }} type="button">{t('returnToTripRate', locale)}</button>}<button className="secondary-button" disabled={archived || commission.status !== 'expected' || !projectionBaseCurrency || !projectionQuoteCurrency || !Number.isFinite(Number(projectionExchangeRate)) || Number(projectionExchangeRate) <= 0} onClick={saveOwnProjectionRate} type="button">{t('useOwnProjectionRate', locale)}</button></div></section>}
    <label>{t('trackingForm', locale)}<input aria-label={t('trackingForm', locale)} disabled={archived} onChange={(event) => setTrackingReference(event.target.value)} value={trackingReference} /></label>
    <div className="form-actions">{onOpenTrip && <button className="secondary-button" onClick={onOpenTrip} type="button">{t('openTrip', locale)}</button>}{onOpenProvider && <button className="secondary-button" onClick={onOpenProvider} type="button">{t('openProvider', locale)}</button>}<button className="secondary-button" disabled={archived || trackingReference.trim() === ''} onClick={() => { void onUpdateTracking(commission.id, trackingReference); }} type="button">{t('saveTracking', locale)}</button>{commission.status === 'expected' && !archived && <button className="primary-button" onClick={() => onMarkPaid(commission)} type="button">{t('recordCommissionPayment', locale)}</button>}</div>
  </section>;
}
