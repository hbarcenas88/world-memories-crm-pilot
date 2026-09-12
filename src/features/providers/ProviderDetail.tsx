import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { PhoneField } from '../../design/components/PhoneField';
import { RecordHeader } from '../../design/components/RecordHeader';
import { useUnsavedChangesGuard } from '../../app/useUnsavedChangesGuard';
import { validateOptionalEmail } from '../../domain/contactValidation';
import type { Currency, Provider } from '../../domain/types';
import { UnsavedChangesDialog } from '../trips/UnsavedChangesDialog';
import { ProviderTaskTemplates, type ProviderTaskTemplateValue } from './ProviderTaskTemplates';

export type ProviderFormValue = Readonly<{
  name: string;
  status: Provider['status'];
  allowedCurrencies: readonly Currency[];
  commissionRate: NonNullable<Provider['commissionRate']>;
  grossCommissionMode: NonNullable<Provider['grossCommissionMode']>;
  defaultGrossRate?: number;
  commissionDueDays: number;
  contactName?: string;
  phone?: string;
  email?: string;
  internalNote?: string;
  references?: readonly string[];
  serviceTypes?: readonly string[];
}>;

type ProviderDetailProps = Readonly<{
  provider?: Provider;
  onSave: (value: ProviderFormValue) => Promise<void>;
  onClose: () => void;
  templates?: readonly import('../../domain/types').ProviderTaskTemplate[];
  onSaveTemplate?: (value: ProviderTaskTemplateValue) => Promise<void>;
  recordActions?: ReactNode;
  onOpenWorkspace?: () => void;
}>;

const currencies: readonly Currency[] = ['USD', 'MXN'];

function commaSeparated(value: string): readonly string[] | undefined {
  const result = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  return result.length === 0 ? undefined : result;
}

export function ProviderDetail({ provider, onSave, onClose, templates = [], onSaveTemplate = async () => undefined, recordActions, onOpenWorkspace }: ProviderDetailProps) {
  const locale = useLocale();
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  const [name, setName] = useState(provider?.name ?? '');
  const [status, setStatus] = useState<Provider['status']>(provider?.status ?? 'active');
  const [allowedCurrencies, setAllowedCurrencies] = useState<readonly Currency[]>(provider?.allowedCurrencies ?? []);
  const [contactName, setContactName] = useState(provider?.contactName ?? '');
  const [phone, setPhone] = useState(provider?.phone ?? '');
  const [email, setEmail] = useState(provider?.email ?? '');
  const [internalNote, setInternalNote] = useState(provider?.internalNote ?? '');
  const [references, setReferences] = useState((provider?.references ?? []).join(', '));
  const [serviceTypes, setServiceTypes] = useState((provider?.serviceTypes ?? []).join(', '));
  const [commissionRate, setCommissionRate] = useState<NonNullable<Provider['commissionRate']>>(provider?.commissionRate ?? 0.8);
  const [grossCommissionMode, setGrossCommissionMode] = useState<NonNullable<Provider['grossCommissionMode']>>(provider?.grossCommissionMode ?? 'variable_amount_per_service');
  const [defaultGrossRate, setDefaultGrossRate] = useState(provider?.defaultGrossRate === undefined ? '' : String(provider.defaultGrossRate * 100));
  const [commissionDueDays, setCommissionDueDays] = useState(String(provider?.commissionDueDays ?? 90));
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [tab, setTab] = useState<'general' | 'commissions' | 'templates'>('general');
  const initialDraft = JSON.stringify({ name: provider?.name ?? '', status: provider?.status ?? 'active', allowedCurrencies: provider?.allowedCurrencies ?? [], contactName: provider?.contactName ?? '', phone: provider?.phone ?? '', email: provider?.email ?? '', internalNote: provider?.internalNote ?? '', references: (provider?.references ?? []).join(', '), serviceTypes: (provider?.serviceTypes ?? []).join(', '), commissionRate: provider?.commissionRate ?? 0.8, grossCommissionMode: provider?.grossCommissionMode ?? 'variable_amount_per_service', defaultGrossRate: provider?.defaultGrossRate === undefined ? '' : String(provider.defaultGrossRate * 100), commissionDueDays: String(provider?.commissionDueDays ?? 90) });
  const hasUnsavedChanges = JSON.stringify({ name, status, allowedCurrencies, contactName, phone, email, internalNote, references, serviceTypes, commissionRate, grossCommissionMode, defaultGrossRate, commissionDueDays }) !== initialDraft;
  const emailValidation = validateOptionalEmail(email);
  const emailErrorId = 'provider-email-error';
  useUnsavedChangesGuard(hasUnsavedChanges);

  function toggleCurrency(currency: Currency, selected: boolean): void {
    setAllowedCurrencies((current) => selected ? [...new Set([...current, currency])] : current.filter((item) => item !== currency));
  }

  async function save(): Promise<boolean> {
    if (!emailValidation.valid) {
      setError(label('invalidEmail'));
      return false;
    }
    const parsedGrossRate = defaultGrossRate.trim() === '' ? undefined : Number(defaultGrossRate) / 100;
    const parsedDueDays = Number(commissionDueDays);
    if (name.trim() === '' || allowedCurrencies.length === 0 || !Number.isInteger(parsedDueDays) || parsedDueDays < 0 || parsedDueDays > 90 || (grossCommissionMode === 'fixed_percentage' && (parsedGrossRate === undefined || !Number.isFinite(parsedGrossRate) || parsedGrossRate <= 0 || parsedGrossRate > 1))) {
      setError(name.trim() === '' ? label('providerNameRequired') : allowedCurrencies.length === 0 ? label('currencyRequired') : !Number.isInteger(parsedDueDays) || parsedDueDays < 0 || parsedDueDays > 90 ? label('termDaysInvalid') : label('grossPercentageInvalid'));
      return false;
    }
    setIsSaving(true);
    setError(undefined);
    try {
      await onSave({ name: name.trim(), status, allowedCurrencies, commissionRate, grossCommissionMode, commissionDueDays: parsedDueDays, ...(grossCommissionMode === 'fixed_percentage' && parsedGrossRate !== undefined ? { defaultGrossRate: parsedGrossRate } : {}), ...(contactName.trim() ? { contactName: contactName.trim() } : {}), ...(phone.trim() ? { phone: phone.trim() } : {}), ...(emailValidation.value ? { email: emailValidation.value } : {}), ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {}), ...(commaSeparated(references) ? { references: commaSeparated(references) } : {}), ...(commaSeparated(serviceTypes) ? { serviceTypes: commaSeparated(serviceTypes) } : {}) });
      return true;
    } catch {
      setError(label('saveProviderFailed'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function requestClose(): void {
    if (hasUnsavedChanges) setShowUnsavedDialog(true);
    else onClose();
  }

  const formActions = (saveLabel: string) => <div className="form-actions"><button className="secondary-button" onClick={requestClose} type="button">{label('cancel')}</button><button className="primary-button" disabled={isSaving} onClick={() => { void save(); }} type="button">{isSaving ? label('saving') : saveLabel}</button></div>;

  const general = <><div className="form-grid"><label>{label('providerName')}<input aria-label={label('providerName')} onChange={(event) => setName(event.target.value)} value={name} /></label><label>{label('status')}<select aria-label={label('status')} onChange={(event) => setStatus(event.target.value as Provider['status'])} value={status}><option value="active">{label('activeStatus')}</option><option value="inactive">{label('inactiveStatus')}</option></select></label></div><fieldset className="currency-fieldset"><legend>{label('allowedCurrencies')}</legend>{currencies.map((currency) => <label key={currency}><input aria-label={currency} checked={allowedCurrencies.includes(currency)} onChange={(event) => toggleCurrency(currency, event.target.checked)} type="checkbox" />{currency}</label>)}</fieldset><div className="form-grid"><label>{label('contact')}<input aria-label={label('contact')} onChange={(event) => setContactName(event.target.value)} value={contactName} /></label><label>{label('phone')}<PhoneField countryLabel={label('internationalPhoneCode')} label={label('phone')} onChange={setPhone} value={phone} /></label><label>{label('email')}<input aria-describedby={!emailValidation.valid ? emailErrorId : undefined} aria-invalid={!emailValidation.valid || undefined} aria-label={label('email')} onChange={(event) => setEmail(event.target.value)} type="email" value={email} />{!emailValidation.valid && <small className="form-error" id={emailErrorId}>{label('invalidEmail')}</small>}</label><label>{label('serviceTypes')}<input aria-label={label('serviceTypes')} onChange={(event) => setServiceTypes(event.target.value)} placeholder={label('serviceTypesPlaceholder')} value={serviceTypes} /></label><label>{label('references')}<input aria-label={label('references')} onChange={(event) => setReferences(event.target.value)} placeholder={label('commaSeparated')} value={references} /></label></div><label className="field-label">{label('internalNotes')}<textarea aria-label={label('internalNotes')} onChange={(event) => setInternalNote(event.target.value)} value={internalNote} /></label>{error && <p className="form-error" role="alert">{error}</p>}{formActions(label('saveProvider'))}</>;

  const commissions = <><div className="form-grid"><label>{label('agencyShare')}<select aria-label={label('agencyShare')} onChange={(event) => setCommissionRate(Number(event.target.value) as NonNullable<Provider['commissionRate']>)} value={commissionRate}><option value="0.8">80%</option><option value="1">100%</option></select></label><label>{label('grossCommissionMode')}<select aria-label={label('grossCommissionMode')} onChange={(event) => setGrossCommissionMode(event.target.value as NonNullable<Provider['grossCommissionMode']>)} value={grossCommissionMode}><option value="variable_amount_per_service">{label('variableAmountPerService')}</option><option value="fixed_percentage">{label('fixedPercentage')}</option></select></label><label>{label('expectedTermDays')}<input aria-label={label('expectedTermDays')} min="0" max="90" onChange={(event) => setCommissionDueDays(event.target.value)} type="number" value={commissionDueDays} /></label>{grossCommissionMode === 'fixed_percentage' && <label>{label('standardGrossPercentage')}<input aria-label={label('standardGrossPercentage')} inputMode="decimal" min="0.01" onChange={(event) => setDefaultGrossRate(event.target.value)} step="0.01" type="number" value={defaultGrossRate} /></label>}</div><p className="muted-copy">{label('variableCommissionDescription')}</p>{error && <p className="form-error" role="alert">{error}</p>}{formActions(label('saveCommissionRules'))}</>;

  return <aside aria-label={label('providerDetails')} className="provider-detail"><RecordHeader actions={<>{onOpenWorkspace && <button className="secondary-button" onClick={onOpenWorkspace} type="button">{label('openFullWorkspace')}</button>}{recordActions}</>} eyebrow={label('provider')} title={provider ? provider.name : label('newProvider')} /><div aria-label={label('providerSections')} className="provider-tabs" role="tablist"><button aria-selected={tab === 'general'} onClick={() => setTab('general')} role="tab" type="button">{label('generalDetails')}</button><button aria-selected={tab === 'commissions'} onClick={() => setTab('commissions')} role="tab" type="button">{label('providerCommissions')}</button><button aria-selected={tab === 'templates'} disabled={!provider} onClick={() => setTab('templates')} role="tab" type="button">{label('providerTaskTemplates')}</button></div>{tab === 'templates' && provider ? <ProviderTaskTemplates onSave={onSaveTemplate} templates={templates} /> : tab === 'commissions' ? commissions : general}{showUnsavedDialog && <UnsavedChangesDialog onCancel={() => setShowUnsavedDialog(false)} onDiscard={onClose} onSave={() => { void save().then((saved) => { if (saved) setShowUnsavedDialog(false); }); }} />}</aside>;
}
