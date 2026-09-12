import { t, useLocale } from '../../app/i18n';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';

type UnsavedChangesDialogProps = Readonly<{
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}>;

export function UnsavedChangesDialog({ onCancel, onDiscard, onSave }: UnsavedChangesDialogProps) {
  const locale = useLocale();
  return <ConfirmDialog
    actions={<>
      <button className="secondary-button" data-dialog-safe onClick={onCancel} type="button">{t('continueEditing', locale)}</button>
      <button className="secondary-button" onClick={onDiscard} type="button">{t('discardChanges', locale)}</button>
      <button className="primary-button" onClick={onSave} type="button">{t('save', locale)}</button>
    </>}
    onCancel={onCancel}
    title={t('unsavedChanges', locale)}
  >
      <p>{t('unsavedChangesDescription', locale)}</p>
  </ConfirmDialog>;
}
