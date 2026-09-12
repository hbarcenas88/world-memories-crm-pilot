import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { t, useLocale, type Locale, type TranslationKey } from '../../app/i18n';
import type { WorkspaceRepository } from '../../application/ports';
import { exportOperationalExcel } from '../../infrastructure/export/excelExport';
import { backupFileName, exportBackup, readBackup, restoreBackup } from '../../infrastructure/export/jsonBackup';
import { applyCsvImport, previewCsvPackage, type CsvImportPreview, type ImportEntity, type ImportIssue } from '../../infrastructure/import/csvImport';
import { buildBackupReminder, type BackupReminder } from './backupReminderModel';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { ContextHelp } from '../../design/components/ContextHelp';
import { OperationProgress } from '../../design/components/OperationProgress';
import { ProcessStepper } from '../../design/components/ProcessStepper';

type DataBackupsPageProps = Readonly<{ repository: WorkspaceRepository; onWorkspaceChanged: () => void; onBackupHistoryChanged: () => void; onDownload?: (blob: Blob, fileName: string) => void | Promise<void> }>;

const importEntityKeys: Record<ImportEntity, TranslationKey> = {
  lead: 'lead', client: 'client', trip: 'trip', service: 'service', service_provider: 'providerAssignment', service_additional_item: 'additionalConcepts', provider: 'provider', provider_task_template: 'taskTemplate', commission: 'commission', note: 'note', task: 'task', payment: 'payment', event: 'activityEvent', deleted_record_reference: 'deletedRecordReferences', package: 'csvZipPackage',
};

function importIssueReason(issue: ImportIssue, locale: Locale): string {
  if (issue.reason === 'Campo obligatorio o valor no válido') return t('importInvalidValue', locale);
  if (issue.reason === 'ID ya existe') return t('importDuplicateId', locale);
  if (issue.reason === 'Nombre obligatorio') return t('importNameRequired', locale);
  if (issue.reason === 'Referencia relacionada inexistente') return t('importRelatedReferenceMissing', locale);
  if (issue.reason === 'Referencia de Lead o Cliente inexistente') return t('importLeadClientReferenceMissing', locale);
  const unsupportedFile = issue.reason.match(/^Archivo no compatible: (.+)$/);
  return unsupportedFile ? t('importUnsupportedFile', locale, { name: unsupportedFile[1] }) : t('importUnclassifiedIssue', locale);
}

function formatImportIssue(issue: ImportIssue, locale: Locale): string {
  return t('issueRow', locale, { entity: t(importEntityKeys[issue.entity], locale), row: issue.row, reason: importIssueReason(issue, locale) });
}

function browserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type FilePickerProps = Readonly<{
  accept: string;
  label: string;
  onSelect: (file: File) => void;
  selectedFile?: File;
}>;

function FilePicker({ accept, label, onSelect, selectedFile }: FilePickerProps) {
  const locale = useLocale();
  const inputId = useId();
  const labelId = `${inputId}-label`;
  const inputRef = useRef<HTMLInputElement>(null);

  return <div className="file-picker">
    <span className="field-label" id={labelId}>{label}</span>
    <div className="file-picker-controls">
      <button className="secondary-button" onClick={() => inputRef.current?.click()} type="button">{t('selectFile', locale)}</button>
      <span aria-live="polite" className="file-picker-name">{selectedFile?.name ?? t('noFileSelected', locale)}</span>
    </div>
    <input accept={accept} aria-labelledby={labelId} className="sr-only" id={inputId} onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) onSelect(file);
    }} ref={inputRef} type="file" />
  </div>;
}

export function DataBackupsPage({ repository, onWorkspaceChanged, onBackupHistoryChanged, onDownload = browserDownload }: DataBackupsPageProps) {
  const locale = useLocale();
  const [message, setMessage] = useState<string>();
  const [csvFile, setCsvFile] = useState<File>();
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview>();
  const [restoreFile, setRestoreFile] = useState<File>();
  const [restoreSummary, setRestoreSummary] = useState<string>();
  const [currentBackupDownloaded, setCurrentBackupDownloaded] = useState(false);
  const [confirmRestoreDialog, setConfirmRestoreDialog] = useState(false);
  const [confirmCsvDialog, setConfirmCsvDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isInspectingRestore, setIsInspectingRestore] = useState(false);
  const [isPreviewingCsv, setIsPreviewingCsv] = useState(false);
  const [isDownloadingJson, setIsDownloadingJson] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [csvImportFinished, setCsvImportFinished] = useState(false);
  const [backupReminder, setBackupReminder] = useState<BackupReminder>();
  const refreshBackupReminder = useCallback((): void => { void repository.listBackupDownloads().then((downloads) => setBackupReminder(buildBackupReminder(downloads, new Date().toISOString()))); }, [repository]);

  useEffect(() => { refreshBackupReminder(); }, [refreshBackupReminder]);

  async function downloadJson(): Promise<void> {
    if (isDownloadingJson) return;
    setIsDownloadingJson(true);
    try {
      const snapshot = await repository.snapshot();
      const now = new Date().toISOString();
      await onDownload(await exportBackup(snapshot), backupFileName(new Date(now)));
      await repository.recordBackupDownload({ id: `full-json-${now}`, kind: 'full_json', downloadedAt: now, schemaVersion: snapshot.schemaVersion });
      setCurrentBackupDownloaded(true);
      refreshBackupReminder();
      onBackupHistoryChanged();
      setMessage(t('jsonBackupDownloaded', locale));
    } catch {
      setMessage(t('jsonBackupCouldNotBeDownloaded', locale));
    } finally {
      setIsDownloadingJson(false);
    }
  }

  async function previewCsv(file: File): Promise<void> {
    setIsPreviewingCsv(true);
    setCsvImportFinished(false);
    try {
      setCsvFile(file);
      setCsvPreview(await previewCsvPackage(file, repository));
      setMessage(undefined);
    } catch {
      setCsvPreview(undefined);
      setMessage(t('csvPackageCouldNotBeRead', locale));
    } finally {
      setIsPreviewingCsv(false);
    }
  }

  async function importCsv(): Promise<void> {
    if (!csvPreview) return;
    setIsImporting(true);
    try {
      await applyCsvImport(csvPreview, repository);
      setMessage(t('importedRecords', locale, { count: csvPreview.accepted }));
      setCsvPreview(undefined);
      setCsvFile(undefined);
      setCsvImportFinished(true);
      setConfirmCsvDialog(false);
      onWorkspaceChanged();
    } catch {
      setMessage(t('csvImportCouldNotBeCompleted', locale));
    } finally {
      setIsImporting(false);
    }
  }

  async function inspectRestore(file: File): Promise<void> {
    setIsInspectingRestore(true);
    try {
      const backup = await readBackup(file);
      setRestoreFile(file);
      setRestoreSummary(t('compatibleBackup', locale, backup.counts));
    } catch {
      setRestoreFile(undefined);
      setRestoreSummary(undefined);
      setMessage(t('backupCouldNotBeValidated', locale));
    } finally {
      setIsInspectingRestore(false);
    }
  }

  async function confirmRestore(): Promise<void> {
    if (!restoreFile || !currentBackupDownloaded) return;
    setIsRestoring(true);
    try {
      await restoreBackup(restoreFile, repository);
      setMessage(t('backupRestored', locale));
      setRestoreFile(undefined);
      setRestoreSummary(undefined);
      setCurrentBackupDownloaded(false);
      onWorkspaceChanged();
      setConfirmRestoreDialog(false);
    } catch {
      setMessage(t('backupCouldNotBeRestored', locale));
    } finally {
      setIsRestoring(false);
    }
  }

  async function downloadExcel(): Promise<void> {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const snapshot = await repository.snapshot();
      const now = new Date().toISOString();
      await onDownload(await exportOperationalExcel(snapshot), 'world-memories-operativo.xlsx');
      await repository.recordBackupDownload({ id: `operational-excel-${now}`, kind: 'operational_excel', downloadedAt: now, schemaVersion: snapshot.schemaVersion });
      refreshBackupReminder();
      onBackupHistoryChanged();
      setMessage(t('operationalExcelDownloaded', locale));
    } catch {
      setMessage(t('operationalExcelCouldNotBeDownloaded', locale));
    } finally {
      setIsExportingExcel(false);
    }
  }

  async function dismissReminder(): Promise<void> {
    if (!backupReminder?.latest) return;
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await repository.dismissBackupReminder(backupReminder.latest.id, until);
    refreshBackupReminder();
    onBackupHistoryChanged();
  }

  return <div className="data-backups-page">
    <section className="data-manual"><h2>{t('protectInformation', locale)}</h2><p>{t('restoreGuide', locale)}</p><p>{t('privateBackupGuide', locale)}</p></section>
    {backupReminder?.eligible && <section className="backup-reminder" role="status"><strong>{t('backupReminderThreeDays', locale)}</strong>{backupReminder.latest && <button className="text-button" onClick={() => { void dismissReminder(); }} type="button">{t('remindTomorrow', locale)}</button>}</section>}
    <section className="data-card"><h2>{t('backupRestore', locale)}<ContextHelp label={t('backupRestore', locale)}>{t('helpBackupFormats', locale)}</ContextHelp></h2><ProcessStepper ariaLabel={t('processProgress', locale)} currentId={isRestoring || (restoreFile && currentBackupDownloaded) ? 'restore' : isInspectingRestore ? 'validate' : restoreFile ? 'backup' : 'select'} steps={[{ id: 'select', label: t('restoreStepSelect', locale) }, { id: 'validate', label: t('restoreStepValidate', locale) }, { id: 'backup', label: t('restoreStepBackup', locale) }, { id: 'restore', label: t('restoreStepRestore', locale) }]} /><div className="form-actions"><button className="primary-button" disabled={isDownloadingJson} onClick={() => { void downloadJson(); }} type="button">{isDownloadingJson ? t('preparingBackup', locale) : t('downloadJsonBackup', locale)}</button><button className="secondary-button" disabled={isExportingExcel} onClick={() => { void downloadExcel(); }} type="button">{isExportingExcel ? t('preparingExport', locale) : t('exportOperationalExcel', locale)}</button></div>{isDownloadingJson && <OperationProgress label={t('preparingBackup', locale)} />}{isExportingExcel && <OperationProgress label={t('preparingExport', locale)} />}<FilePicker accept="application/json,.json" label={t('jsonRestoreFile', locale)} onSelect={(file) => { void inspectRestore(file); }} selectedFile={restoreFile} />{restoreSummary && <p className="data-summary">{restoreSummary}</p>}{isInspectingRestore && <OperationProgress label={t('validatingBackup', locale)} />}{isRestoring && <OperationProgress label={t('restoringBackup', locale)} />}<button className="secondary-button" disabled={!restoreFile || !currentBackupDownloaded} onClick={() => setConfirmRestoreDialog(true)} type="button">{t('restoreBackup', locale)}</button>{restoreFile && !currentBackupDownloaded && <p className="form-error">{t('downloadCurrentBackupFirst', locale)}</p>}</section>
    <section className="data-card"><h2>{t('importCsvPackage', locale)}</h2><ProcessStepper ariaLabel={t('processProgress', locale)} currentId={isImporting || csvImportFinished ? 'result' : confirmCsvDialog ? 'confirm' : csvPreview ? 'preview' : 'file'} steps={[{ id: 'file', label: t('csvStepFile', locale) }, { id: 'preview', label: t('csvStepPreview', locale) }, { id: 'confirm', label: t('csvStepConfirm', locale) }, { id: 'result', label: t('csvStepResult', locale) }]} /><p className="muted-copy">{t('csvPackageInstruction', locale)}</p><FilePicker accept="application/zip,.zip" label={t('csvZipPackage', locale)} onSelect={(file) => { void previewCsv(file); }} selectedFile={csvFile} />{isPreviewingCsv && <OperationProgress label={t('validatingCsvPackage', locale)} />}{isImporting && <OperationProgress label={t('importingCsvPackage', locale)} />}{csvPreview && <div className="data-summary"><strong>{t('preview', locale)}</strong><p>{t('readyToImport', locale, { accepted: csvPreview.accepted, duplicates: csvPreview.duplicates, rejected: csvPreview.rejected })}</p>{csvPreview.issues.length > 0 && <ul>{csvPreview.issues.map((issue) => <li key={`${issue.entity}-${issue.row}-${issue.reason}`}>{formatImportIssue(issue, locale)}</li>)}</ul>}<button className="primary-button" disabled={!csvFile || csvPreview.accepted === 0} onClick={() => setConfirmCsvDialog(true)} type="button">{t('confirmImport', locale)}</button></div>}</section>
    {message && <p className="data-message" role="status">{message}</p>}
    {confirmRestoreDialog && <ConfirmDialog actions={<><button className="secondary-button" data-dialog-safe disabled={isRestoring} onClick={() => setConfirmRestoreDialog(false)} type="button">{t('cancel', locale)}</button><button className="danger-button" disabled={isRestoring} onClick={() => { void confirmRestore(); }} type="button">{t('restoreBackup', locale)}</button></>} busy={isRestoring} onCancel={() => setConfirmRestoreDialog(false)} title={t('restoreBackup', locale)}><p>{restoreSummary}</p><p>{t('restoreGuide', locale)}</p></ConfirmDialog>}
    {confirmCsvDialog && csvPreview && <ConfirmDialog actions={<><button className="secondary-button" data-dialog-safe disabled={isImporting} onClick={() => setConfirmCsvDialog(false)} type="button">{t('cancel', locale)}</button><button className="primary-button" disabled={isImporting} onClick={() => { void importCsv(); }} type="button">{t('confirmImport', locale)}</button></>} busy={isImporting} onCancel={() => setConfirmCsvDialog(false)} title={t('confirmImport', locale)}><p>{t('confirmImportDescription', locale, { accepted: csvPreview.accepted, duplicates: csvPreview.duplicates, rejected: csvPreview.rejected })}</p></ConfirmDialog>}
  </div>;
}
