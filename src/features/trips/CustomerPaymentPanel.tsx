import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { customerBalance, paymentDueReminderDates } from '../../domain/paymentDue';
import type { Currency, Payment, ServiceProvider } from '../../domain/types';
import { formatOperationalDate, formatOperationalNumber } from '../../domain/operationalDate';
import { OperationalDateField } from '../../design/components/OperationalDateField';

export type CustomerPaymentComponent = Readonly<{
  id: string;
  serviceName: string;
  providerName: string;
  currency: Currency;
  saleAmount?: number;
  reservationLocator?: string;
  customerBalanceDueOn?: string;
  archived?: boolean;
  commissionStatus?: ServiceProvider['commissionStatus'];
  cancellationOutcome?: ServiceProvider['cancellationOutcome'];
  cancelledAt?: string;
}>;

type CustomerPaymentPanelProps = Readonly<{
  components: readonly CustomerPaymentComponent[];
  payments: readonly Payment[];
  onRecordPayment: (input: Readonly<{ serviceProviderId: string; amount: Readonly<{ amount: number; currency: Currency }>; occurredOn: string }>) => Promise<void>;
  onCorrectPayment?: (input: Readonly<{ paymentId: string; amount: Readonly<{ amount: number; currency: Currency }>; occurredOn: string }>) => Promise<void>;
  onAssignInitialPayment?: (input: Readonly<{ paymentId: string; serviceProviderId: string }>) => Promise<void>;
  onOpenPaymentWorkspace?: (payment: Payment) => void;
  renderPaymentActions?: (payment: Payment) => ReactNode;
  onEnableCommission?: (serviceProviderId: string) => Promise<void>;
  onRecordCancellation?: (input: Readonly<{ serviceProviderId: string; cancellationOutcome: NonNullable<ServiceProvider['cancellationOutcome']>; commissionOutcome: 'cancel' | 'continue' }>) => Promise<void>;
}>;

function formatReminder(date: string): string { return formatOperationalDate(date); }

function formatAmount(amount: number): string { return formatOperationalNumber(amount); }

export function CustomerPaymentPanel({ components, payments, onRecordPayment, onCorrectPayment = async () => undefined, onAssignInitialPayment = async () => undefined, onOpenPaymentWorkspace, renderPaymentActions, onEnableCommission, onRecordCancellation }: CustomerPaymentPanelProps) {
  const locale = useLocale();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [occurredOn, setOccurredOn] = useState<Record<string, string>>({});
  const [savingComponentId, setSavingComponentId] = useState<string>();
  const [initialAssignments, setInitialAssignments] = useState<Record<string, string>>({});
  const [assigningPaymentId, setAssigningPaymentId] = useState<string>();
  const [editingPaymentId, setEditingPaymentId] = useState<string>();
  const [correctionAmounts, setCorrectionAmounts] = useState<Record<string, string>>({});
  const [correctionDates, setCorrectionDates] = useState<Record<string, string>>({});
  const [correctingPaymentId, setCorrectingPaymentId] = useState<string>();
  const [error, setError] = useState<string>();
  const [enablingCommissionId, setEnablingCommissionId] = useState<string>();
  const [cancellingComponentId, setCancellingComponentId] = useState<string>();
  const [cancellationOutcomes, setCancellationOutcomes] = useState<Record<string, NonNullable<ServiceProvider['cancellationOutcome']> | ''>>({});
  const [commissionOutcomes, setCommissionOutcomes] = useState<Record<string, 'cancel' | 'continue' | ''>>({});
  const [recordingCancellationId, setRecordingCancellationId] = useState<string>();

  async function recordCancellation(component: CustomerPaymentComponent): Promise<void> {
    const cancellationOutcome = cancellationOutcomes[component.id];
    const commissionOutcome = commissionOutcomes[component.id];
    if (!cancellationOutcome || !commissionOutcome || !onRecordCancellation) {
      setError(t('cancellationOutcomeRequired', locale));
      return;
    }
    setRecordingCancellationId(component.id);
    setError(undefined);
    try {
      await onRecordCancellation({ serviceProviderId: component.id, cancellationOutcome, commissionOutcome });
      setCancellingComponentId(undefined);
    } catch {
      setError(t('cancellationCouldNotBeRecorded', locale));
    } finally {
      setRecordingCancellationId(undefined);
    }
  }

  if (components.length === 0) return <p className="muted-copy">{t('noPaymentComponents', locale)}</p>;

  async function record(component: CustomerPaymentComponent): Promise<void> {
    const amount = Number(amounts[component.id]);
    const effectiveDate = occurredOn[component.id];
    if (!Number.isFinite(amount) || amount <= 0 || !effectiveDate) {
      setError(t('positiveAmountDateRequired', locale));
      return;
    }
    setSavingComponentId(component.id);
    setError(undefined);
    try {
      await onRecordPayment({ serviceProviderId: component.id, amount: { amount, currency: component.currency }, occurredOn: effectiveDate });
      setAmounts((current) => ({ ...current, [component.id]: '' }));
      setOccurredOn((current) => ({ ...current, [component.id]: '' }));
    } catch {
      setError(t('paymentCouldNotBeRecorded', locale));
    } finally {
      setSavingComponentId(undefined);
    }
  }

  async function assignInitialPayment(payment: Payment): Promise<void> {
    const serviceProviderId = initialAssignments[payment.id];
    if (!serviceProviderId) {
      setError(t('selectComponentReceivedAdvance', locale));
      return;
    }
    setAssigningPaymentId(payment.id);
    setError(undefined);
    try {
      await onAssignInitialPayment({ paymentId: payment.id, serviceProviderId });
    } catch {
      setError(t('advanceCouldNotBeAssigned', locale));
    } finally {
      setAssigningPaymentId(undefined);
    }
  }

  function beginCorrection(payment: Payment): void {
    setEditingPaymentId(payment.id);
    setCorrectionAmounts((current) => ({ ...current, [payment.id]: String(payment.amount.amount) }));
    setCorrectionDates((current) => ({ ...current, [payment.id]: payment.occurredAt.slice(0, 10) }));
    setError(undefined);
  }

  async function correct(payment: Payment): Promise<void> {
    const amount = Number(correctionAmounts[payment.id]);
    const effectiveDate = correctionDates[payment.id];
    if (!Number.isFinite(amount) || amount <= 0 || !effectiveDate) {
      setError(t('correctionAmountDateRequired', locale));
      return;
    }
    setCorrectingPaymentId(payment.id);
    setError(undefined);
    try {
      await onCorrectPayment({ paymentId: payment.id, amount: { amount, currency: payment.amount.currency }, occurredOn: effectiveDate });
      setEditingPaymentId(undefined);
    } catch {
      setError(t('paymentCouldNotBeCorrected', locale));
    } finally {
      setCorrectingPaymentId(undefined);
    }
  }

  return <section aria-label={t('customerPayments', locale)} className="customer-payment-panel">
    {payments.filter((payment) => payment.source === 'first_conversion_payment' && !payment.serviceProviderId).map((payment) => {
      const compatibleComponents = components.filter((component) => component.currency === payment.amount.currency);
      const selectedComponent = compatibleComponents.find((component) => component.id === initialAssignments[payment.id]);
      return <article className="initial-payment-assignment" key={payment.id}>
        <strong>{t('conversionAdvance', locale, { amount: formatAmount(payment.amount.amount), currency: payment.amount.currency })}</strong>
        {compatibleComponents.length === 0 ? <p className="muted-copy">{t('addSameCurrencyComponent', locale)}</p> : <div className="payment-entry">
          <label>{t('component', locale)}<select aria-label={t('assignConversionAdvance', locale)} onChange={(event) => setInitialAssignments((current) => ({ ...current, [payment.id]: event.target.value }))} value={initialAssignments[payment.id] ?? ''}><option value="">{t('select', locale)}</option>{compatibleComponents.map((component) => <option key={component.id} value={component.id}>{component.serviceName} · {component.providerName}</option>)}</select></label>
          <button className="secondary-button" disabled={assigningPaymentId === payment.id} onClick={() => { void assignInitialPayment(payment); }} type="button">{assigningPaymentId === payment.id ? t('assigning', locale) : t('assignAdvanceTo', locale, { component: selectedComponent?.serviceName ?? t('component', locale).toLowerCase() })}</button>
        </div>}
      </article>;
    })}
    {components.map((component) => {
      const componentPayments = payments.filter((payment) => payment.serviceProviderId === component.id);
      const paid = componentPayments.reduce((total, payment) => total + payment.amount.amount, 0);
      const balance = component.saleAmount === undefined ? undefined : customerBalance({ amount: component.saleAmount, currency: component.currency }, componentPayments.map((payment) => payment.amount));
      const reminders = component.customerBalanceDueOn ? paymentDueReminderDates(component.customerBalanceDueOn).map(formatReminder).join(' · ') : undefined;
      return <article className="payment-component" key={component.id}>
        <div><strong>{component.serviceName}</strong><span>{component.providerName}</span>{component.reservationLocator && <span>{t('reservationLocator', locale)}: {component.reservationLocator}</span>}{component.archived && <span className="archived-label">{t('serviceArchived', locale)}</span>}{component.cancelledAt && <span className="archived-label">{t('componentCancellationRecorded', locale)}</span>}</div>
        <p>{t('totalPaid', locale, { amount: formatAmount(paid), currency: component.currency })}</p>
        <p>{balance === undefined ? t('pendingBalanceUnknown', locale) : t('pendingBalance', locale, { amount: formatAmount(balance), currency: component.currency })}</p>
        {component.customerBalanceDueOn && <p>{t('dueDate', locale, { date: formatReminder(component.customerBalanceDueOn) })}</p>}
        {reminders && <p className="muted-copy">{t('internalReminders', locale, { dates: reminders })}</p>}
        {component.commissionStatus === 'without_commission' && onEnableCommission && <button className="text-button" disabled={enablingCommissionId === component.id} onClick={() => { setEnablingCommissionId(component.id); void onEnableCommission(component.id).catch(() => setError(t('commissionCouldNotBeEnabled', locale))).finally(() => setEnablingCommissionId(undefined)); }} type="button">{enablingCommissionId === component.id ? t('enablingCommission', locale) : t('enableCommission', locale)}</button>}
        {!component.archived && !component.cancelledAt && onRecordCancellation && (cancellingComponentId === component.id ? <div className="payment-entry"><label>{t('cancellationOutcomeFor', locale, { service: component.serviceName })}<select aria-label={t('cancellationOutcomeFor', locale, { service: component.serviceName })} onChange={(event) => setCancellationOutcomes((current) => ({ ...current, [component.id]: event.target.value as NonNullable<ServiceProvider['cancellationOutcome']> | '' }))} value={cancellationOutcomes[component.id] ?? ''}><option value="">{t('select', locale)}</option><option value="refunded">{t('componentRefunded', locale)}</option><option value="non_refundable">{t('componentNonRefundable', locale)}</option><option value="partial">{t('componentPartialCancellation', locale)}</option></select></label><label>{t('commissionOutcomeFor', locale, { service: component.serviceName })}<select aria-label={t('commissionOutcomeFor', locale, { service: component.serviceName })} onChange={(event) => setCommissionOutcomes((current) => ({ ...current, [component.id]: event.target.value as 'cancel' | 'continue' | '' }))} value={commissionOutcomes[component.id] ?? ''}><option value="">{t('select', locale)}</option><option value="cancel">{t('cancelCommission', locale)}</option><option value="continue">{t('keepCommissionFollowUp', locale)}</option></select></label><button className="secondary-button" disabled={recordingCancellationId === component.id} onClick={() => { void recordCancellation(component); }} type="button">{recordingCancellationId === component.id ? t('recording', locale) : t('confirmCancellationOutcome', locale)}</button></div> : <button className="text-button" onClick={() => setCancellingComponentId(component.id)} type="button">{t('recordComponentCancellation', locale, { service: component.serviceName })}</button>)}
        {componentPayments.length > 0 && <div className="payment-history">{componentPayments.map((payment) => <div key={payment.id}>
          <span>{formatAmount(payment.amount.amount)} {payment.amount.currency} · {formatOperationalDate(payment.occurredAt)}{payment.archivedAt ? ` · ${t('paymentArchived', locale)}` : ''}</span>
          {onOpenPaymentWorkspace && <button className="text-button" onClick={() => onOpenPaymentWorkspace(payment)} type="button">{t('openFullWorkspaceFor', locale, { record: payment.id })}</button>}{!payment.archivedAt && !component.archived && (editingPaymentId === payment.id ? <div className="payment-entry">
            <label>{t('correctedAmount', locale)}<input aria-label={t('correctionAmountFor', locale, { id: payment.id })} inputMode="decimal" min="0" onChange={(event) => setCorrectionAmounts((current) => ({ ...current, [payment.id]: event.target.value }))} step="0.01" type="number" value={correctionAmounts[payment.id] ?? ''} /></label>
            <label>{t('correctedEffectiveDate', locale)}<OperationalDateField aria-label={t('correctionDateFor', locale, { id: payment.id })} onChange={(date) => setCorrectionDates((current) => ({ ...current, [payment.id]: date }))} value={correctionDates[payment.id]} /></label>
            <button className="secondary-button" disabled={correctingPaymentId === payment.id} onClick={() => { void correct(payment); }} type="button">{correctingPaymentId === payment.id ? t('correcting', locale) : t('saveCorrectionFor', locale, { id: payment.id })}</button>
          </div> : <button className="text-button" onClick={() => beginCorrection(payment)} type="button">{t('editPayment', locale, { id: payment.id })}</button>)}{renderPaymentActions?.(payment)}
        </div>)}</div>}
        {!component.archived && !component.cancelledAt && <div className="payment-entry">
          <label>{t('amount', locale)}<input aria-label={t('paymentAmountFor', locale, { service: component.serviceName })} inputMode="decimal" min="0" onChange={(event) => setAmounts((current) => ({ ...current, [component.id]: event.target.value }))} step="0.01" type="number" value={amounts[component.id] ?? ''} /></label>
          <label>{t('effectiveDate', locale)}<OperationalDateField aria-label={t('paymentEffectiveDateFor', locale, { service: component.serviceName })} onChange={(date) => setOccurredOn((current) => ({ ...current, [component.id]: date }))} value={occurredOn[component.id]} /></label>
          <button className="secondary-button" disabled={savingComponentId === component.id} onClick={() => { void record(component); }} type="button">{savingComponentId === component.id ? t('recording', locale) : t('recordPaymentFor', locale, { service: component.serviceName })}</button>
        </div>}
      </article>;
    })}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
