import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Commission, Currency } from '../../domain/types';
import { OperationalDateField } from '../../design/components/OperationalDateField';

export function CommissionPaymentDialog({ commission, onCancel, onConfirm }: { commission: Commission; onCancel: () => void; onConfirm: (received: { amount: number; currency: Currency }, confirmDifference: boolean, paidOn: string, note?: string) => void }) {
  const locale = useLocale();
  const [amount, setAmount] = useState(String(commission.expected.amount));
  const [currency, setCurrency] = useState<Currency>(commission.expected.currency);
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [confirmDifference, setConfirmDifference] = useState(false);
  const [note, setNote] = useState('');
  const differs = Number(amount) !== commission.expected.amount || currency !== commission.expected.currency;

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (Number.isFinite(Number(amount)) && Number(amount) >= 0 && paidOn) onConfirm({ amount: Number(amount), currency }, confirmDifference, paidOn, note || undefined);
  }

  return <form className="conversion-form" onSubmit={submit}>
    <h3>{t('recordCommissionPaymentTitle', locale)}</h3>
    <label>{t('receivedAmount', locale)}<input aria-label={t('receivedAmount', locale)} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} value={amount} /></label>
    <label>{t('receivedCurrency', locale)}<select aria-label={t('receivedCurrency', locale)} onChange={(event) => setCurrency(event.target.value as Currency)} value={currency}><option value="USD">USD</option><option value="MXN">MXN</option></select></label>
    <label>{t('paymentEffectiveDate', locale)}<OperationalDateField aria-label={t('paymentEffectiveDate', locale)} onChange={setPaidOn} value={paidOn} /></label>
    {differs && <label><input aria-label={t('confirmDifference', locale)} checked={confirmDifference} onChange={(event) => setConfirmDifference(event.target.checked)} type="checkbox" /> {t('confirmDifferenceDescription', locale)}</label>}
    {differs && <label>{t('differenceNote', locale)}<textarea aria-label={t('differenceNote', locale)} onChange={(event) => setNote(event.target.value)} value={note} /></label>}
    <div className="form-actions"><button className="secondary-button" onClick={onCancel} type="button">{t('cancel', locale)}</button><button className="primary-button" disabled={differs && !confirmDifference} type="submit">{t('savePayment', locale)}</button></div>
  </form>;
}
