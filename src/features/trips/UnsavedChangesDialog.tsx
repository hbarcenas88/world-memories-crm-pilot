import { useEffect, useRef } from 'react';
import { t, useLocale } from '../../app/i18n';

type UnsavedChangesDialogProps = Readonly<{
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}>;

export function UnsavedChangesDialog({ onCancel, onDiscard, onSave }: UnsavedChangesDialogProps) {
  const locale = useLocale();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  return <div className="dialog-backdrop" role="presentation">
    <section aria-label={t('unsavedChanges', locale)} aria-modal="true" className="confirm-dialog" role="dialog">
      <h2>{t('unsavedChanges', locale)}</h2>
      <p>{t('unsavedChangesDescription', locale)}</p>
      <div className="form-actions">
        <button className="secondary-button" onClick={onCancel} ref={cancelRef} type="button">{t('cancel', locale)}</button>
        <button className="secondary-button" onClick={onDiscard} type="button">{t('discardChanges', locale)}</button>
        <button className="primary-button" onClick={onSave} type="button">{t('save', locale)}</button>
      </div>
    </section>
  </div>;
}
