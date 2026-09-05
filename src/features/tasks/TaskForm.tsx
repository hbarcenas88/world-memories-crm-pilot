import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import type { Commission, Lead, Task, Trip } from '../../domain/types';

export type TaskFormValue = Readonly<{ title: string; dueOn: string; dueTime?: string; required: boolean; leadId?: string; tripId?: string; commissionId?: string }>;

function valueFor(task?: Task): TaskFormValue {
  return { title: task?.title ?? '', dueOn: task?.dueOn ?? '', ...(task?.dueTime ? { dueTime: task.dueTime } : {}), required: task?.required ?? false, ...(task?.leadId ? { leadId: task.leadId } : {}), ...(task?.tripId ? { tripId: task.tripId } : {}), ...(task?.commissionId ? { commissionId: task.commissionId } : {}) };
}

function selectedLink(value: TaskFormValue): string {
  return value.leadId ? `lead:${value.leadId}` : value.tripId ? `trip:${value.tripId}` : value.commissionId ? `commission:${value.commissionId}` : '';
}

export function TaskForm({ task, leads, trips, commissions, onCancel, onSave }: Readonly<{ task?: Task; leads: readonly Lead[]; trips: readonly Trip[]; commissions: readonly Commission[]; onCancel: () => void; onSave: (value: TaskFormValue) => void }>) {
  const locale = useLocale();
  const [value, setValue] = useState<TaskFormValue>(() => valueFor(task));
  const [error, setError] = useState<string>();
  const label = (key: import('../../app/i18n').TranslationKey) => t(key, locale);
  const selectLink = (next: string) => {
    if (!next) { setValue((current) => ({ ...current, leadId: undefined, tripId: undefined, commissionId: undefined })); return; }
    const [kind, id] = next.split(':');
    setValue((current) => ({ ...current, leadId: kind === 'lead' ? id : undefined, tripId: kind === 'trip' ? id : undefined, commissionId: kind === 'commission' ? id : undefined }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.title.trim() || !value.dueOn) { setError(label('taskTitleAndDateRequired')); return; }
    setError(undefined); onSave({ ...value, title: value.title.trim(), ...(value.dueTime ? { dueTime: value.dueTime } : {}) });
  };
  return <form className="task-form" noValidate onSubmit={submit}>
    <div className="form-grid">
      <label>{label('taskTitle')}<input aria-label={label('taskTitle')} onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))} value={value.title} /></label>
      <label>{label('taskDueDate')}<OperationalDateField aria-label={label('taskDueDate')} onChange={(dueOn) => setValue((current) => ({ ...current, dueOn }))} value={value.dueOn} /></label>
      <label>{label('taskTime')}<input aria-label={label('taskTime')} onChange={(event) => setValue((current) => ({ ...current, dueTime: event.target.value }))} type="time" value={value.dueTime ?? ''} /></label>
      <label>{label('linkTaskTo')}<select aria-label={label('linkTaskTo')} onChange={(event) => selectLink(event.target.value)} value={selectedLink(value)}><option value="">{label('noTaskLink')}</option>{leads.map((lead) => <option key={lead.id} value={`lead:${lead.id}`}>{t('linkLead', locale, { name: lead.name || lead.id })}</option>)}{trips.map((trip) => <option key={trip.id} value={`trip:${trip.id}`}>{t('linkTrip', locale, { name: trip.id })}</option>)}{commissions.map((commission) => <option key={commission.id} value={`commission:${commission.id}`}>{t('linkCommission', locale, { name: commission.id })}</option>)}</select></label>
    </div>
    <label className="toggle-field"><input aria-label={label('required')} checked={value.required} onChange={(event) => setValue((current) => ({ ...current, required: event.target.checked }))} type="checkbox" />{label('required')}</label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="secondary-button" onClick={onCancel} type="button">{label('cancel')}</button><button className="primary-button" type="submit">{task ? label('save') : label('createTask')}</button></div>
  </form>;
}
