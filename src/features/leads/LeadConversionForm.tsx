import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import { AmountField } from '../../design/components/AmountField';
import { ProcessStepper } from '../../design/components/ProcessStepper';
import { formatOperationalAmount } from '../../domain/operationalNumber';
import type { Client, Currency } from '../../domain/types';

type ConversionSubmission = Readonly<{ amount: number; currency: Currency; clientId?: string; primaryMemberId?: string }>;
type Step = 'client' | 'payment' | 'review';

export function LeadConversionForm({ clients, linkedClientId, onConfirm, onCancel }: { clients: readonly Client[]; linkedClientId?: string; onConfirm: (payment: ConversionSubmission) => void; onCancel: () => void }) {
  const locale = useLocale();
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  const [step, setStep] = useState<Step>('client');
  const [amount, setAmount] = useState<number | undefined>(); const [isAmountValid, setIsAmountValid] = useState(true); const [currency, setCurrency] = useState<Currency | ''>(''); const [clientId, setClientId] = useState(linkedClientId ?? '');
  const initialClient = clients.find((client) => client.id === linkedClientId);
  const [primaryMemberId, setPrimaryMemberId] = useState(initialClient?.members?.find((member) => member.status === 'active')?.id ?? ''); const [error, setError] = useState('');
  const selectedClient = clients.find((client) => client.id === clientId); const activeMembers = selectedClient?.members?.filter((member) => member.status === 'active') ?? [];
  const steps = [{ id: 'client', label: label('conversionClientStep') }, { id: 'payment', label: label('conversionPaymentStep') }, { id: 'review', label: label('conversionReviewStep') }];
  function selectClient(nextClientId: string) { setClientId(nextClientId); setPrimaryMemberId(clients.find((client) => client.id === nextClientId)?.members?.find((member) => member.status === 'active')?.id ?? ''); }
  function next(): void { if (step === 'client') { if (clientId && !primaryMemberId) { setError(label('primaryContactRequiredForConversion')); return; } setError(''); setStep('payment'); return; } if (!isAmountValid || amount === undefined || currency === '') { setError(label('conversionRequired')); return; } setError(''); setStep('review'); }
  function submit(event: FormEvent) { event.preventDefault(); if (step !== 'review') { next(); return; } if (amount === undefined) return; onConfirm({ amount, currency: currency as Currency, ...(clientId ? { clientId, primaryMemberId } : {}) }); }
  return <form className="conversion-form" onSubmit={submit}><h3>{label('recordFirstPayment')}</h3><ProcessStepper ariaLabel={label('processProgress')} currentId={step} steps={steps} />
    {step === 'client' && <><p>{label('conversionDescription')}</p>{clients.length > 0 && <label>{label('client')}<select aria-label={label('client')} value={clientId} onChange={(event) => selectClient(event.target.value)}><option value="">{label('createNewClient')}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}{clientId && <label>{label('primaryContact')}<select aria-label={label('primaryContact')} disabled={activeMembers.length === 0} onChange={(event) => setPrimaryMemberId(event.target.value)} value={primaryMemberId}><option value="">{activeMembers.length === 0 ? label('primaryContactRequiredForConversion') : label('select')}</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>}</>}
    {step === 'payment' && <><label>{label('advance')}<AmountField errorMessage={label('conversionRequired')} label={label('advance')} onChange={setAmount} onValidityChange={setIsAmountValid} value={amount} /></label><label>{label('currency')}<select aria-label={label('currency')} value={currency} onChange={(event) => setCurrency(event.target.value as Currency | '')}><option value="">{label('select')}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label></>}
    {step === 'review' && <section aria-label={label('conversionReviewStep')} className="detail-summary"><p>{selectedClient?.name ?? label('createNewClient')}</p><p>{amount === undefined ? '' : formatOperationalAmount(amount)} {currency}</p></section>}
    {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="secondary-button" type="button" onClick={step === 'client' ? onCancel : () => setStep(step === 'review' ? 'payment' : 'client')}>{step === 'client' ? label('cancel') : label('previous')}</button><button className="primary-button" type="submit">{step === 'review' ? label('confirmSale') : label('next')}</button></div></form>;
}
