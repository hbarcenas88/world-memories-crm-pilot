import { useState } from 'react';
import { t, useLocale } from '../../app/i18n';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import type { Task } from '../../domain/types';

export function TaskRescheduleControl({ task, onReschedule }: Readonly<{ task: Task; onReschedule: (taskId: string, dueOn: string) => void | Promise<void> }>) {
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  if (task.archivedAt || task.status !== 'open') return null;
  if (!editing) return <button className="text-button" onClick={() => { setDraft(task.dueOn); setError(undefined); setEditing(true); }} type="button">{t('rescheduleTask', locale)}</button>;
  return <>
    <OperationalDateField aria-label={t('newDateFor', locale, { task: task.title })} onChange={setDraft} value={draft} />
    <button className="secondary-button" disabled={saving || !draft || draft === task.dueOn} onClick={() => {
      if (!draft) return;
      setSaving(true);
      setError(undefined);
      void Promise.resolve(onReschedule(task.id, draft))
        .then(() => setEditing(false))
        .catch(() => setError(t('taskSaveFailed', locale)))
        .finally(() => setSaving(false));
    }} type="button">{t('applyDate', locale)}</button>
    <button className="text-button" disabled={saving} onClick={() => { setError(undefined); setEditing(false); }} type="button">{t('cancel', locale)}</button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </>;
}
