import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import { useUnsavedChangesGuard } from '../../app/useUnsavedChangesGuard';
import type { Commission, Currency } from '../../domain/types';
import { AmountField } from '../../design/components/AmountField';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { UnsavedChangesDialog } from '../trips/UnsavedChangesDialog';

export function CommissionPaymentDialog({ commission, onCancel, onConfirm }: { commission: Commission; onCancel: () => void; onConfirm: (received: { amount: number; currency: Currency }, confirmDifference: boolean, paidOn: string, note?: string) => void }) {
  const locale = useLocale();
  const [amount, setAmount] = useState<number | undefined>(commission.expected.amount);
  const [isAmountValid, setIsAmountValid] = useState(true);
  const [currency, setCurrency] = useState<Currency>(commission.expected.currency);
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [initialPaidOn] = useState(paidOn);
  const [confirmDifference, setConfirmDifference] = useState(false);
  const [note, setNote] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const differs = amount !== commission.expected.amount || currency !== commission.expected.currency;
  const initialDraft = JSON.stringify({ amount: commission.expected.amount, currency: commission.expected.currency, paidOn: initialPaidOn, confirmDifference: false, note: '' });
  const hasUnsavedChanges = JSON.stringify({ amount, currency, paidOn, confirmDifference, note }) !== initialDraft;
  useUnsavedChangesGuard(hasUnsavedChanges);

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (isAmountValid && amount !== undefined && paidOn) onConfirm({ amount, currency }, confirmDifference, paidOn, note || undefined);
  }

  return <form className="conversion-form" onSubmit={submit}>
    <h3>{t('recordCommissionPaymentTitle', locale)}</h3>
    <label>{t('receivedAmount', locale)}<AmountField errorMessage={t('conversionRequired', locale)} label={t('receivedAmount', locale)} onChange={setAmount} onValidityChange={setIsAmountValid} value={amount} /></label>
    <label>{t('receivedCurrency', locale)}<select aria-label={t('receivedCurrency', locale)} onChange={(event) => setCurrency(event.target.value as Currency)} value={currency}><option value="USD">USD</option><option value="MXN">MXN</option></select></label>
    <label>{t('paymentEffectiveDate', locale)}<OperationalDateField aria-label={t('paymentEffectiveDate', locale)} onChange={setPaidOn} value={paidOn} /></label>
    {differs && <label><input aria-label={t('confirmDifference', locale)} checked={confirmDifference} onChange={(event) => setConfirmDifference(event.target.checked)} type="checkbox" /> {t('confirmDifferenceDescription', locale)}</label>}
    {differs && <label>{t('differenceNote', locale)}<textarea aria-label={t('differenceNote', locale)} onChange={(event) => setNote(event.target.value)} value={note} /></label>}
    <div className="form-actions"><button className="secondary-button" onClick={() => hasUnsavedChanges ? setShowUnsavedDialog(true) : onCancel()} type="button">{t('cancel', locale)}</button><button className="primary-button" disabled={!isAmountValid || amount === undefined || (differs && !confirmDifference)} type="submit">{t('savePayment', locale)}</button></div>
    {showUnsavedDialog && <UnsavedChangesDialog onCancel={() => setShowUnsavedDialog(false)} onDiscard={onCancel} onSave={() => setShowUnsavedDialog(false)} />}
  </form>;
}
