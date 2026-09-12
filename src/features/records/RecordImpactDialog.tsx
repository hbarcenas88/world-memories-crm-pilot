import { useState } from 'react';
import type { RecordDeleteOptions, RecordImpact } from '../../application/recordImpact';
import { t, useLocale, type TranslationKey } from '../../app/i18n';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { ContextHelp } from '../../design/components/ContextHelp';
import { ImpactDetails } from './ImpactDetails';

type RecordImpactDialogProps = Readonly<{
  archived?: boolean;
  impact: RecordImpact;
  onArchive: () => void | Promise<void>;
  onCancel: () => void;
  onDelete: (options: RecordDeleteOptions) => void | Promise<void>;
  onRefreshImpact?: () => void | Promise<void>;
}>;

const dependencyKeys: Readonly<Record<string, readonly [TranslationKey, TranslationKey]>> = {
  'Asignación de proveedor': ['providerAssignment', 'providerAssignments'],
  Cliente: ['clientRecord', 'clients'],
  'Concepto adicional': ['additionalConcepts', 'additionalConcepts'],
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

export function RecordImpactDialog({ archived = false, impact, onArchive, onCancel, onDelete, onRefreshImpact }: RecordImpactDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [removeOwnEvents, setRemoveOwnEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [impactChanged, setImpactChanged] = useState(false);
  const locale = useLocale();
  const dependencySummary = dependencyText(impact, locale);
  const ownEventCount = impact.dependencies.find((dependency) => dependency.label === 'Evento de actividad')?.count ?? 0;

  async function submit(action: () => void | Promise<void>): Promise<void> {
    setIsSubmitting(true);
    setSubmissionError(false);
    try {
      await action();
    } catch (error) {
      if (error instanceof Error && error.message === 'record impact changed; review the deletion again') {
        setConfirmingDelete(false);
        setImpactChanged(true);
        await onRefreshImpact?.();
      }
      setSubmissionError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <ConfirmDialog
    actions={confirmingDelete ? <>
      <button className="secondary-button" data-dialog-safe disabled={isSubmitting} onClick={() => setConfirmingDelete(false)} type="button">{t('back', locale)}</button>
      <button className="danger-button" disabled={isSubmitting} onClick={() => { void submit(() => onDelete({ removeOwnEvents, expectedFingerprint: impact.fingerprint })); }} type="button">{t('deletePermanently', locale)}</button>
    </> : <>
      <button className="secondary-button" data-dialog-safe disabled={isSubmitting} onClick={onCancel} type="button">{t('cancel', locale)}</button>
      {!archived && <button className={impact.canDelete ? 'secondary-button' : 'primary-button'} disabled={isSubmitting} onClick={() => { void submit(onArchive); }} type="button">{t(impact.canDelete ? 'archive' : 'archiveInstead', locale)}</button>}
      <button className="danger-button" disabled={isSubmitting} onClick={() => setConfirmingDelete(true)} type="button">{t('delete', locale)}</button>
    </>}
    busy={isSubmitting}
    onCancel={confirmingDelete ? () => setConfirmingDelete(false) : onCancel}
    title={t('manageRecord', locale, { record: impact.title })}
  >
      {confirmingDelete ? <>
        <p id="record-impact-dialog-description">{t('definitiveDeleteDescription', locale)}</p>
        {!impact.canDelete && <p className="form-warning">{t('relatedRecordsRemain', locale)}</p>}
        {ownEventCount > 0 && <label className="confirm-dialog-check"><input checked={removeOwnEvents} onChange={(event) => setRemoveOwnEvents(event.target.checked)} type="checkbox" />{t('removeOwnEvents', locale, { count: ownEventCount })}</label>}
      </> : <>
        <p id="record-impact-dialog-description">{impact.canDelete ? t('noRelationsDescription', locale) : t('relatedDescription', locale, { dependencies: dependencySummary })}<ContextHelp label={t('manageRecord', locale, { record: impact.title })}>{t('helpDeletionImpact', locale)}</ContextHelp></p>
        {impact.dependencies.length > 0 && <ImpactDetails dependencies={impact.dependencies} />}
      </>}
      {submissionError && <p aria-live="polite" className="form-warning">{t('recordActionFailed', locale)}</p>}
      {impactChanged && <p aria-live="polite" className="form-warning">{t('recordImpactChanged', locale)}</p>}
  </ConfirmDialog>;
}
