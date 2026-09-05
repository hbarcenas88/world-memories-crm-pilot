import { useState } from 'react';
import type { RecordImpact } from '../../application/recordImpact';
import { t, useLocale, type TranslationKey } from '../../app/i18n';

type RecordImpactDialogProps = Readonly<{
  impact: RecordImpact;
  onArchive: () => void;
  onCancel: () => void;
  onDelete: () => void;
}>;

const dependencyKeys: Readonly<Record<string, readonly [TranslationKey, TranslationKey]>> = {
  'Asignación de proveedor': ['providerAssignment', 'providerAssignments'],
  'Evento de actividad': ['activityEvent', 'activityEvents'],
  Lead: ['lead', 'leads'],
  Nota: ['note', 'notes'],
  Pago: ['payment', 'payments'],
  'Plantilla de tarea': ['taskTemplate', 'taskTemplates'],
  Servicio: ['service', 'services'],
  Tarea: ['task', 'tasks'],
  Viaje: ['trip', 'trips'],
  Comisión: ['commission', 'commissions'],
};

function dependencyText(impact: RecordImpact, locale: ReturnType<typeof useLocale>): string {
  return impact.dependencies.map(({ count, label }) => {
    const keys = dependencyKeys[label];
    return `${count} ${keys ? t(keys[count === 1 ? 0 : 1], locale) : label}`;
  }).join(t('dependencyJoiner', locale));
}

export function RecordImpactDialog({ impact, onArchive, onCancel, onDelete }: RecordImpactDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const locale = useLocale();
  const dependencySummary = dependencyText(impact, locale);

  return <div className="dialog-backdrop" role="presentation">
    <section aria-describedby="record-impact-dialog-description" aria-labelledby="record-impact-dialog-title" aria-modal="true" className="confirm-dialog" role="dialog">
      <h2 id="record-impact-dialog-title">{t('manageRecord', locale, { record: impact.title })}</h2>
      {confirmingDelete ? <>
        <p id="record-impact-dialog-description">{t('definitiveDeleteDescription', locale)}</p>
        <div className="form-actions">
          <button className="secondary-button" onClick={() => setConfirmingDelete(false)} type="button">{t('back', locale)}</button>
          <button className="danger-button" onClick={onDelete} type="button">{t('deletePermanently', locale)}</button>
        </div>
      </> : impact.canDelete ? <>
        <p id="record-impact-dialog-description">{t('noRelationsDescription', locale)}</p>
        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel} type="button">{t('cancel', locale)}</button>
          <button className="secondary-button" onClick={onArchive} type="button">{t('archive', locale)}</button>
          <button className="danger-button" onClick={() => setConfirmingDelete(true)} type="button">{t('delete', locale)}</button>
        </div>
      </> : <>
        <p id="record-impact-dialog-description">{t('relatedDescription', locale, { dependencies: dependencySummary })}</p>
        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel} type="button">{t('cancel', locale)}</button>
          <button className="primary-button" onClick={onArchive} type="button">{t('archive', locale)}</button>
        </div>
      </>}
    </section>
  </div>;
}
