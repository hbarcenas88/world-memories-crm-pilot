import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Payment } from '../../domain/types';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { formatOperationalDate, formatOperationalNumber } from '../../domain/operationalDate';

type PaymentDetailProps = Readonly<{
  onCorrect: (input: Readonly<{ paymentId: string; amount: Readonly<{ amount: number; currency: 'USD' | 'MXN' }>; occurredOn: string }>) => Promise<void>;
  payment: Payment;
  recordActions?: ReactNode;
  serviceName?: string;
}>;

export function PaymentDetail({ onCorrect, payment, recordActions, serviceName }: PaymentDetailProps) {
  const locale = useLocale();
  const [amount, setAmount] = useState(String(payment.amount.amount));
  const [occurredOn, setOccurredOn] = useState(payment.occurredAt.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const numericAmount = Number(amount);
  const canCorrect = !payment.archivedAt && Boolean(payment.serviceProviderId) && Number.isFinite(numericAmount) && numericAmount > 0 && Boolean(occurredOn);
  return <section aria-label={t('paymentDetails', locale)} className="task-detail">
    <div className="detail-header"><div><p className="detail-status">{t('payment', locale)}</p><h2>{t('paymentDetails', locale)}</h2></div>{recordActions}</div>
    <dl className="detail-summary"><div><dt>{t('amount', locale)}</dt><dd>{formatOperationalNumber(payment.amount.amount)} {payment.amount.currency}</dd></div><div><dt>{t('effectiveDate', locale)}</dt><dd>{formatOperationalDate(payment.occurredAt)}</dd></div><div><dt>{t('component', locale)}</dt><dd>{serviceName ?? t('undefinedValue', locale)}</dd></div><div><dt>{t('status', locale)}</dt><dd>{payment.archivedAt ? t('archivedRecord', locale) : t('receivedAmount', locale)}</dd></div></dl>
    {!payment.archivedAt && payment.serviceProviderId && <div className="form-grid"><label>{t('correctedAmount', locale)}<input aria-label={t('correctionAmountFor', locale, { id: payment.id })} inputMode="decimal" min="0" onChange={(event) => setAmount(event.target.value)} step="0.01" type="number" value={amount} /></label><label>{t('correctedEffectiveDate', locale)}<OperationalDateField aria-label={t('correctionDateFor', locale, { id: payment.id })} onChange={setOccurredOn} value={occurredOn} /></label></div>}
    <div className="form-actions">{payment.serviceProviderId && <button className="primary-button" disabled={!canCorrect || saving} onClick={() => { setSaving(true); void onCorrect({ paymentId: payment.id, amount: { amount: numericAmount, currency: payment.amount.currency }, occurredOn }).finally(() => setSaving(false)); }} type="button">{saving ? t('correcting', locale) : t('saveCorrectionFor', locale, { id: payment.id })}</button>}</div>
  </section>;
}
