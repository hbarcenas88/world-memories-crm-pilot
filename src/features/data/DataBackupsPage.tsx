import { useCallback, useEffect, useState } from 'react';
import { t, useLocale, type Locale, type TranslationKey } from '../../app/i18n';
import type { WorkspaceRepository } from '../../application/ports';
import { exportOperationalExcel } from '../../infrastructure/export/excelExport';
import { backupFileName, exportBackup, readBackup, restoreBackup } from '../../infrastructure/export/jsonBackup';
import { applyCsvImport, previewCsvPackage, type CsvImportPreview, type ImportEntity, type ImportIssue } from '../../infrastructure/import/csvImport';
import { buildBackupReminder, type BackupReminder } from './backupReminderModel';

type DataBackupsPageProps = Readonly<{ repository: WorkspaceRepository; onWorkspaceChanged: () => void; onBackupHistoryChanged: () => void; onDownload?: (blob: Blob, fileName: string) => void }>;

const importEntityKeys: Record<ImportEntity, TranslationKey> = {
  lead: 'lead', client: 'client', trip: 'trip', service: 'service', service_provider: 'providerAssignment', service_additional_item: 'additionalConcepts', provider: 'provider', provider_task_template: 'taskTemplate', commission: 'commission', note: 'note', task: 'task', payment: 'payment', event: 'activityEvent', package: 'csvZipPackage',
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

export function DataBackupsPage({ repository, onWorkspaceChanged, onBackupHistoryChanged, onDownload = browserDownload }: DataBackupsPageProps) {
  const locale = useLocale();
  const [message, setMessage] = useState<string>();
  const [csvFile, setCsvFile] = useState<File>();
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview>();
  const [restoreFile, setRestoreFile] = useState<File>();
  const [restoreSummary, setRestoreSummary] = useState<string>();
  const [currentBackupDownloaded, setCurrentBackupDownloaded] = useState(false);
  const [backupReminder, setBackupReminder] = useState<BackupReminder>();
  const refreshBackupReminder = useCallback((): void => { void repository.listBackupDownloads().then((downloads) => setBackupReminder(buildBackupReminder(downloads, new Date().toISOString()))); }, [repository]);

  useEffect(() => { refreshBackupReminder(); }, [refreshBackupReminder]);

  async function downloadJson(): Promise<void> {
    const snapshot = await repository.snapshot();
    const now = new Date().toISOString();
    await onDownload(await exportBackup(snapshot), backupFileName(new Date(now)));
    await repository.recordBackupDownload({ id: `full-json-${now}`, kind: 'full_json', downloadedAt: now, schemaVersion: snapshot.schemaVersion });
    setCurrentBackupDownloaded(true);
    refreshBackupReminder();
    onBackupHistoryChanged();
    setMessage(t('jsonBackupDownloaded', locale));
  }

  async function previewCsv(file: File): Promise<void> {
    try {
      setCsvFile(file);
      setCsvPreview(await previewCsvPackage(file, repository));
      setMessage(undefined);
    } catch {
      setCsvPreview(undefined);
      setMessage(t('csvPackageCouldNotBeRead', locale));
    }
  }

  async function importCsv(): Promise<void> {
    if (!csvPreview) return;
    await applyCsvImport(csvPreview, repository);
    setMessage(t('importedRecords', locale, { count: csvPreview.accepted }));
    setCsvPreview(undefined);
    setCsvFile(undefined);
    onWorkspaceChanged();
  }

  async function inspectRestore(file: File): Promise<void> {
    try {
      const backup = await readBackup(file);
      setRestoreFile(file);
      setRestoreSummary(t('compatibleBackup', locale, backup.counts));
    } catch {
      setRestoreFile(undefined);
      setRestoreSummary(undefined);
      setMessage(t('backupCouldNotBeValidated', locale));
    }
  }

  async function confirmRestore(): Promise<void> {
    if (!restoreFile || !currentBackupDownloaded) return;
    await restoreBackup(restoreFile, repository);
    setMessage(t('backupRestored', locale));
    setRestoreFile(undefined);
    setRestoreSummary(undefined);
    setCurrentBackupDownloaded(false);
    onWorkspaceChanged();
  }

  async function downloadExcel(): Promise<void> {
    const snapshot = await repository.snapshot();
    const now = new Date().toISOString();
    await onDownload(await exportOperationalExcel(snapshot), 'world-memories-operativo.xlsx');
    await repository.recordBackupDownload({ id: `operational-excel-${now}`, kind: 'operational_excel', downloadedAt: now, schemaVersion: snapshot.schemaVersion });
    refreshBackupReminder();
    onBackupHistoryChanged();
    setMessage(t('operationalExcelDownloaded', locale));
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
    <section className="data-card"><h2>{t('backupRestore', locale)}</h2><div className="form-actions"><button className="primary-button" onClick={() => { void downloadJson(); }} type="button">{t('downloadJsonBackup', locale)}</button><button className="secondary-button" onClick={() => { void downloadExcel(); }} type="button">{t('exportOperationalExcel', locale)}</button></div><label className="field-label">{t('jsonRestoreFile', locale)}<input accept="application/json,.json" aria-label={t('jsonRestoreFile', locale)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void inspectRestore(file); }} type="file" /></label>{restoreSummary && <p className="data-summary">{restoreSummary}</p>}<button className="secondary-button" disabled={!restoreFile || !currentBackupDownloaded} onClick={() => { void confirmRestore(); }} type="button">{t('restoreBackup', locale)}</button>{restoreFile && !currentBackupDownloaded && <p className="form-error">{t('downloadCurrentBackupFirst', locale)}</p>}</section>
    <section className="data-card"><h2>{t('importCsvPackage', locale)}</h2><p className="muted-copy">{t('csvPackageInstruction', locale)}</p><label className="field-label">{t('csvZipPackage', locale)}<input accept="application/zip,.zip" aria-label={t('csvZipPackage', locale)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void previewCsv(file); }} type="file" /></label>{csvPreview && <div className="data-summary"><strong>{t('preview', locale)}</strong><p>{t('readyToImport', locale, { accepted: csvPreview.accepted, duplicates: csvPreview.duplicates, rejected: csvPreview.rejected })}</p>{csvPreview.issues.length > 0 && <ul>{csvPreview.issues.map((issue) => <li key={`${issue.entity}-${issue.row}-${issue.reason}`}>{formatImportIssue(issue, locale)}</li>)}</ul>}<button className="primary-button" disabled={!csvFile || csvPreview.accepted === 0} onClick={() => { void importCsv(); }} type="button">{t('confirmImport', locale)}</button></div>}</section>
    {message && <p className="data-message" role="status">{message}</p>}
  </div>;
}
