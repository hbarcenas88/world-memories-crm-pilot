import { useState } from 'react';
import type { ManagedRecordRef, RecordDeleteOptions, RecordImpact } from '../../application/recordImpact';
import { t, useLocale } from '../../app/i18n';
import { ActionMenu, type ActionMenuItem } from '../../design/components/ActionMenu';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { RecordImpactDialog } from './RecordImpactDialog';

type RecordActionsProps = Readonly<{
  archived?: boolean;
  label: string;
  loadImpact: (target: ManagedRecordRef) => Promise<RecordImpact>;
  onArchive: (target: ManagedRecordRef) => void | Promise<void>;
  onDelete: (target: ManagedRecordRef, options: RecordDeleteOptions) => void | Promise<void>;
  onEdit?: (target: ManagedRecordRef) => void;
  onRestore?: (target: ManagedRecordRef) => void;
  target: ManagedRecordRef;
}>;

export function RecordActions({ archived = false, label, loadImpact, onArchive, onDelete, onEdit, onRestore, target }: RecordActionsProps) {
  const [impact, setImpact] = useState<RecordImpact>();
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [impactLoadFailed, setImpactLoadFailed] = useState(false);
  const locale = useLocale();

  function closeImpact(): void {
    setImpact(undefined);
    setImpactLoadFailed(false);
  }

  async function openImpact(): Promise<void> {
    setLoadingImpact(true);
    setImpactLoadFailed(false);
    try {
      setImpact(await loadImpact(target));
    } catch {
      setImpactLoadFailed(true);
    } finally {
      setLoadingImpact(false);
    }
  }

  const editAction = onEdit ? [{ id: 'edit', label: t('edit', locale), onSelect: () => onEdit(target) }] : [];
  const actions: readonly ActionMenuItem[] = archived
    ? [...editAction, { id: 'restore', label: t('restore', locale), onSelect: () => onRestore?.(target) }, { id: 'delete', label: t('delete', locale), onSelect: () => { void openImpact(); } }]
    : [...editAction, { id: 'manage', label: t('archiveOrDelete', locale), onSelect: () => { void openImpact(); } }];

  return <>
    <ActionMenu actions={actions} label={label} />
    {(loadingImpact || impactLoadFailed) && <ConfirmDialog
      actions={<><button className="secondary-button" data-dialog-safe disabled={loadingImpact} onClick={closeImpact} type="button">{t('cancel', locale)}</button>{impactLoadFailed && <button className="primary-button" onClick={() => { void openImpact(); }} type="button">{t('retry', locale)}</button>}</>}
      busy={loadingImpact}
      onCancel={closeImpact}
      title={t('manageRecord', locale, { record: label })}
    >
      {loadingImpact ? <p role="status">{t('loadingRecordImpact', locale)}</p> : <p className="form-warning" role="alert">{t('recordImpactLoadFailed', locale)}</p>}
    </ConfirmDialog>}
    {impact && <RecordImpactDialog
      archived={archived}
      impact={impact}
      onArchive={async () => {
        await onArchive(target);
        closeImpact();
      }}
      onCancel={closeImpact}
      onDelete={async (options) => {
        await onDelete(target, options);
        closeImpact();
      }}
      onRefreshImpact={async () => setImpact(await loadImpact(target))}
    />}
  </>;
}
