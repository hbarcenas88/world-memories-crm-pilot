import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Payment } from '../../domain/types';
import { AmountField } from '../../design/components/AmountField';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { formatOperationalDate, formatOperationalNumber } from '../../domain/operationalDate';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { RecordHeader } from '../../design/components/RecordHeader';

type PaymentDetailProps = Readonly<{
  onCorrect: (input: Readonly<{ paymentId: string; amount: Readonly<{ amount: number; currency: 'USD' | 'MXN' }>; occurredOn: string }>) => Promise<void>;
  payment: Payment;
  recordActions?: ReactNode;
  serviceName?: string;
}>;

export function PaymentDetail({ onCorrect, payment, recordActions, serviceName }: PaymentDetailProps) {
  const locale = useLocale();
  const [amount, setAmount] = useState<number | undefined>(payment.amount.amount);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [occurredOn, setOccurredOn] = useState(payment.occurredAt.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string>();
  const canCorrect = !payment.archivedAt && Boolean(payment.serviceProviderId) && isAmountValid && amount !== undefined && amount > 0 && Boolean(occurredOn);
  async function saveCorrection(): Promise<void> {
    setSaving(true);
    setError(undefined);
    try {
      if (amount === undefined) return;
      await onCorrect({ paymentId: payment.id, amount: { amount, currency: payment.amount.currency }, occurredOn });
      setShowConfirmation(false);
    } catch {
      setError(t('paymentCouldNotBeCorrected', locale));
    } finally {
      setSaving(false);
    }
  }
  return <section aria-label={t('paymentDetails', locale)} className="task-detail">
    <RecordHeader actions={recordActions} eyebrow={t('payment', locale)} title={t('paymentDetails', locale)} />
    <dl className="detail-summary"><div><dt>{t('amount', locale)}</dt><dd>{formatOperationalNumber(payment.amount.amount)} {payment.amount.currency}</dd></div><div><dt>{t('effectiveDate', locale)}</dt><dd>{formatOperationalDate(payment.occurredAt)}</dd></div><div><dt>{t('component', locale)}</dt><dd>{serviceName ?? t('undefinedValue', locale)}</dd></div><div><dt>{t('status', locale)}</dt><dd>{payment.archivedAt ? t('archivedRecord', locale) : t('receivedAmount', locale)}</dd></div></dl>
    {!payment.archivedAt && payment.serviceProviderId && <div className="form-grid"><label>{t('correctedAmount', locale)}<AmountField errorMessage={t('correctionAmountDateRequired', locale)} label={t('correctionAmountFor', locale, { id: payment.id })} onChange={setAmount} onValidityChange={setIsAmountValid} value={amount} /></label><label>{t('correctedEffectiveDate', locale)}<OperationalDateField aria-label={t('correctionDateFor', locale, { id: payment.id })} onChange={setOccurredOn} value={occurredOn} /></label></div>}
    <div className="form-actions">{payment.serviceProviderId && <button className="primary-button" disabled={!canCorrect || saving} onClick={() => setShowConfirmation(true)} type="button">{saving ? t('correcting', locale) : t('saveCorrectionFor', locale, { id: payment.id })}</button>}</div>
    {error && !showConfirmation && <p className="form-error" role="alert">{error}</p>}
    {showConfirmation && <ConfirmDialog actions={<><button className="secondary-button" data-dialog-safe disabled={saving} onClick={() => setShowConfirmation(false)} type="button">{t('cancel', locale)}</button><button className="primary-button" disabled={saving} onClick={() => { void saveCorrection(); }} type="button">{t('confirmPaymentCorrection', locale)}</button></>} busy={saving} onCancel={() => setShowConfirmation(false)} title={t('confirmPaymentCorrection', locale)}><p>{t('confirmPaymentCorrectionDescription', locale, { amount: formatOperationalNumber(amount ?? 0), currency: payment.amount.currency, date: formatOperationalDate(occurredOn) })}</p>{error && <p className="form-error" role="alert">{error}</p>}</ConfirmDialog>}
  </section>;
}
