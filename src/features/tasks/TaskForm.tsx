import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { useUnsavedChangesGuard } from '../../app/useUnsavedChangesGuard';
import { OperationalTimeField } from '../../design/components/OperationalTimeField';
import { UnsavedChangesDialog } from '../trips/UnsavedChangesDialog';
import type { Commission, DeletedRecordReference, Lead, Task, Trip } from '../../domain/types';
import { formatOperationalDate } from '../../domain/operationalDate';
import { resolveRecordReference } from '../../domain/recordReference';

export type TaskFormValue = Readonly<{ title: string; dueOn: string; dueTime?: string; required: boolean; leadId?: string; tripId?: string; commissionId?: string }>;

function valueFor(task?: Task): TaskFormValue {
  return { title: task?.title ?? '', dueOn: task?.dueOn ?? '', ...(task?.dueTime ? { dueTime: task.dueTime } : {}), required: task?.required ?? false, ...(task?.leadId ? { leadId: task.leadId } : {}), ...(task?.tripId ? { tripId: task.tripId } : {}), ...(task?.commissionId ? { commissionId: task.commissionId } : {}) };
}

function selectedLink(value: TaskFormValue): string {
  return value.leadId ? `lead:${value.leadId}` : value.tripId ? `trip:${value.tripId}` : value.commissionId ? `commission:${value.commissionId}` : '';
}

export function TaskForm({ task, leads, trips, clients = [], deletedReferences = [], commissions, onCancel, onSave }: Readonly<{ task?: Task; leads: readonly Lead[]; trips: readonly Trip[]; clients?: readonly import('../../domain/types').Client[]; deletedReferences?: readonly DeletedRecordReference[]; commissions: readonly Commission[]; onCancel: () => void; onSave: (value: TaskFormValue) => void | Promise<void> }>) {
  const locale = useLocale();
  const [value, setValue] = useState<TaskFormValue>(() => valueFor(task));
  const [error, setError] = useState<string>();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [isDateValid, setIsDateValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  const tripLabel = (trip: Trip | undefined, tripId?: string): string => {
    if (!trip) {
      const resolvedTrip = resolveRecordReference(trips, deletedReferences, 'trip', tripId);
      return resolvedTrip.state === 'deleted'
        ? t('deletedRecordReference', locale, { record: resolvedTrip.reference.displayLabel })
        : label('trip');
    }
    const resolvedClient = resolveRecordReference(
      clients,
      deletedReferences,
      'client',
      trip.clientId,
    );
    const client = resolvedClient.state === 'live'
      ? resolvedClient.record.name
      : resolvedClient.state === 'deleted'
        ? t('deletedRecordReference', locale, { record: resolvedClient.reference.displayLabel })
        : label('unnamedClient');
    const date = trip.effectiveStartOn ? formatOperationalDate(trip.effectiveStartOn) : label('clientDatesToDefine');
    return `${label('trip')} · ${client} · ${date}`;
  };
  const selectLink = (next: string) => {
    if (!next) { setValue((current) => ({ ...current, leadId: undefined, tripId: undefined, commissionId: undefined })); return; }
    const [kind, id] = next.split(':');
    setValue((current) => ({ ...current, leadId: kind === 'lead' ? id : undefined, tripId: kind === 'trip' ? id : undefined, commissionId: kind === 'commission' ? id : undefined }));
  };
  const save = async (): Promise<boolean> => {
    if (!value.title.trim() || !value.dueOn) { setError(label('taskTitleAndDateRequired')); return false; }
    if (!isDateValid) { setError(label('invalidDate')); return false; }
    if (!isTimeValid) { setError(label('invalidTime')); return false; }
    setError(undefined); setSaving(true);
    try { await onSave({ ...value, title: value.title.trim(), ...(value.dueTime ? { dueTime: value.dueTime } : {}) }); return true; }
    catch { setError(label('taskSaveFailed')); return false; }
    finally { setSaving(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void save(); };
  const hasUnsavedChanges = JSON.stringify(value) !== JSON.stringify(valueFor(task));
  useUnsavedChangesGuard(hasUnsavedChanges);
  return <form className="task-form" noValidate onSubmit={submit}>
    <h2>{task ? label('editTask') : label('newTask')}</h2>
    <div className="form-grid">
      <label>{label('taskTitle')}<input aria-label={label('taskTitle')} onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))} value={value.title} /></label>
      <label>{label('taskDueDate')}<OperationalDateField aria-label={label('taskDueDate')} onChange={(dueOn) => setValue((current) => ({ ...current, dueOn }))} onValidityChange={setIsDateValid} value={value.dueOn} /></label>
      <label>{label('taskTime')}<OperationalTimeField aria-label={label('taskTime')} onChange={(dueTime) => setValue((current) => ({ ...current, dueTime: dueTime || undefined }))} onValidityChange={setIsTimeValid} value={value.dueTime} /></label>
      <label>{label('linkTaskTo')}<select aria-label={label('linkTaskTo')} onChange={(event) => selectLink(event.target.value)} value={selectedLink(value)}><option value="">{label('noTaskLink')}</option>{leads.map((lead) => <option key={lead.id} value={`lead:${lead.id}`}>{t('linkLead', locale, { name: lead.name || label('unnamedLead') })}</option>)}{trips.map((trip) => <option key={trip.id} value={`trip:${trip.id}`}>{t('linkTrip', locale, { name: tripLabel(trip) })}</option>)}{commissions.map((commission) => <option key={commission.id} value={`commission:${commission.id}`}>{t('linkCommission', locale, { name: tripLabel(trips.find((trip) => trip.id === commission.tripId), commission.tripId) })}</option>)}</select></label>
    </div>
    <label className="toggle-field"><input aria-label={label('required')} checked={value.required} onChange={(event) => setValue((current) => ({ ...current, required: event.target.checked }))} type="checkbox" />{label('required')}</label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="secondary-button" disabled={saving} onClick={() => hasUnsavedChanges ? setShowUnsavedDialog(true) : onCancel()} type="button">{label('cancel')}</button><button className="primary-button" disabled={saving} type="submit">{task ? label('save') : label('createTask')}</button></div>
    {showUnsavedDialog && <UnsavedChangesDialog onCancel={() => setShowUnsavedDialog(false)} onDiscard={onCancel} onSave={() => { void save().then((saved) => { if (saved) setShowUnsavedDialog(false); }); }} />}
  </form>;
}
