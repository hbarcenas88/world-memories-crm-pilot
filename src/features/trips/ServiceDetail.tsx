import { useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import type { Service } from '../../domain/types';
import { OperationalDateField } from '../../design/components/OperationalDateField';

type ServiceDetailProps = Readonly<{
  onSave: (value: Readonly<{ name: string; startOn?: string; endOn?: string }>) => Promise<void>;
  recordActions?: ReactNode;
  service: Service;
}>;

export function ServiceDetail({ onSave, recordActions, service }: ServiceDetailProps) {
  const locale = useLocale();
  const [name, setName] = useState(service.name);
  const [startOn, setStartOn] = useState(service.startOn ?? '');
  const [endOn, setEndOn] = useState(service.endOn ?? '');
  const [saving, setSaving] = useState(false);
  const canSave = name.trim() !== '' && (name !== service.name || startOn !== (service.startOn ?? '') || endOn !== (service.endOn ?? ''));
  return <section aria-label={t('serviceDetails', locale)} className="task-detail">
    <div className="detail-header"><div><p className="detail-status">{t('service', locale)}</p><h2>{t('serviceDetails', locale)}</h2></div>{recordActions}</div>
    {service.archivedAt && <p className="archived-label">{t('archivedRecord', locale)}</p>}
    <div className="form-grid"><label>{t('serviceName', locale)}<input aria-label={t('serviceName', locale)} onChange={(event) => setName(event.target.value)} value={name} /></label><label>{t('serviceStart', locale)}<OperationalDateField aria-label={t('serviceStart', locale)} onChange={setStartOn} value={startOn} /></label><label>{t('serviceEnd', locale)}<OperationalDateField aria-label={t('serviceEnd', locale)} onChange={setEndOn} value={endOn} /></label></div>
    <div className="form-actions"><button className="primary-button" disabled={!canSave || saving} onClick={() => { setSaving(true); void onSave({ name: name.trim(), ...(startOn ? { startOn } : {}), ...(endOn ? { endOn } : {}) }).finally(() => setSaving(false)); }} type="button">{saving ? t('saving', locale) : t('saveService', locale)}</button></div>
  </section>;
}
