import { useState } from 'react';
import type { ManagedRecordRef, RecordImpact } from '../../application/recordImpact';
import { t, useLocale } from '../../app/i18n';
import { ActionMenu, type ActionMenuItem } from '../../design/components/ActionMenu';
import { RecordImpactDialog } from './RecordImpactDialog';

type RecordActionsProps = Readonly<{
  archived?: boolean;
  label: string;
  loadImpact: (target: ManagedRecordRef) => Promise<RecordImpact>;
  onArchive: (target: ManagedRecordRef) => void;
  onDelete: (target: ManagedRecordRef) => void;
  onEdit?: (target: ManagedRecordRef) => void;
  onRestore?: (target: ManagedRecordRef) => void;
  target: ManagedRecordRef;
}>;

export function RecordActions({ archived = false, label, loadImpact, onArchive, onDelete, onEdit, onRestore, target }: RecordActionsProps) {
  const [impact, setImpact] = useState<RecordImpact>();
  const locale = useLocale();

  function closeImpact(): void {
    setImpact(undefined);
  }

  function openImpact(): void {
    void loadImpact(target).then(setImpact);
  }

  const editAction = onEdit ? [{ id: 'edit', label: t('edit', locale), onSelect: () => onEdit(target) }] : [];
  const actions: readonly ActionMenuItem[] = archived
    ? [...editAction, { id: 'restore', label: t('restore', locale), onSelect: () => onRestore?.(target) }]
    : [...editAction, { id: 'manage', label: t('archiveOrDelete', locale), onSelect: openImpact }];

  return <>
    <ActionMenu actions={actions} label={label} />
    {impact && <RecordImpactDialog
      impact={impact}
      onArchive={() => { closeImpact(); onArchive(target); }}
      onCancel={closeImpact}
      onDelete={() => { closeImpact(); onDelete(target); }}
    />}
  </>;
}
