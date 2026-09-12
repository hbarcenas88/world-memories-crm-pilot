import { cleanup, render, screen } from '@testing-library/react';
import { strToU8, zipSync } from 'fflate';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { DataBackupsPage } from '../../src/features/data/DataBackupsPage';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

afterEach(cleanup);

async function csvPackage(files: Record<string, string>): Promise<File> {
  const entries = Object.entries(files).map(([name, content]) => [name, strToU8(content)] as const);
  const manifest = {
    format: 'world-memories-import', schemaVersion: 1, exportedAt: '2026-08-31T00:00:00.000Z', files: await Promise.all(entries.map(async ([name, content]) => ({
      name,
      checksum: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', content)), (byte) => byte.toString(16).padStart(2, '0')).join(''),
      rowCount: Math.max(0, new TextDecoder().decode(content).trim().split(/\r?\n/).length - 1),
    }))),
  };
  return new File([zipSync({ ...Object.fromEntries(entries), 'manifest.json': strToU8(JSON.stringify(manifest)) })], 'world-memories-import.zip', { type: 'application/zip' });
}

describe('DataBackupsPage', () => {
  it('explains backup handling and requires a current download before enabling a restore', async () => {
    const user = userEvent.setup();
    const download = vi.fn();
    const repository = new MemoryWorkspaceRepository();
    render(<DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={download} onWorkspaceChanged={vi.fn()} repository={repository} />);

    expect(screen.getByText(/restaurar sustituye los datos actuales/i)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Restaurar respaldo' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Descargar respaldo JSON' }));
    expect(download).toHaveBeenCalledOnce();
  });

  it('keeps backup history unchanged and explains if a JSON download cannot start', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    render(<DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={vi.fn().mockRejectedValue(new Error('synthetic download error'))} onWorkspaceChanged={vi.fn()} repository={repository} />);

    await user.click(screen.getByRole('button', { name: 'Descargar respaldo JSON' }));

    expect(await screen.findByText('No se pudo descargar el respaldo JSON. Inténtalo de nuevo.')).toBeTruthy();
    await expect(repository.listBackupDownloads()).resolves.toHaveLength(0);
    expect((screen.getByRole('button', { name: 'Descargar respaldo JSON' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders backup and import controls in English without changing the file formats', () => {
    const repository = new MemoryWorkspaceRepository();
    render(<LocaleProvider locale="en"><DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={vi.fn()} onWorkspaceChanged={vi.fn()} repository={repository} /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'Protect your information' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Backup and restore' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download JSON backup' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export operational Excel' })).toBeTruthy();
    expect(screen.getByLabelText('JSON file to restore')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Import CSV package' })).toBeTruthy();
    expect(screen.getByLabelText('CSV ZIP package')).toBeTruthy();
  });

  it('uses deliberate file-selection controls and shows that no source file has been chosen yet', () => {
    const repository = new MemoryWorkspaceRepository();
    render(<DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={vi.fn()} onWorkspaceChanged={vi.fn()} repository={repository} />);

    expect(screen.getAllByRole('button', { name: 'Seleccionar archivo' })).toHaveLength(2);
    expect(screen.getAllByText('Aún no se ha seleccionado un archivo')).toHaveLength(2);
    expect(screen.getByLabelText('Archivo JSON para restaurar')).toBeTruthy();
    expect(screen.getByLabelText('Paquete CSV ZIP')).toBeTruthy();
  });

  it('localizes CSV preview entities and rejection reasons without changing the input file', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    render(<LocaleProvider locale="en"><DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={vi.fn()} onWorkspaceChanged={vi.fn()} repository={repository} /></LocaleProvider>);

    await user.upload(screen.getByLabelText('CSV ZIP package'), await csvPackage({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at\nlead-invalid,,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z',
    }));

    expect(await screen.findByText('Lead row 2: Name is required')).toBeTruthy();
    expect(screen.queryByText(/Nombre obligatorio/)).toBeNull();
  });

  it('requires an explicit second confirmation before importing a reviewed CSV package', async () => {
    const user = userEvent.setup();
    const repository = new MemoryWorkspaceRepository();
    render(<DataBackupsPage onBackupHistoryChanged={vi.fn()} onDownload={vi.fn()} onWorkspaceChanged={vi.fn()} repository={repository} />);

    await user.upload(screen.getByLabelText('Paquete CSV ZIP'), await csvPackage({
      'leads.csv': 'id,name,acquisition_source,requested_date_status,status,created_at,budget_amount,budget_currency\nlead-importado,Lead sintético,Web,dates_to_define,contacted,2026-08-20T00:00:00.000Z,0,USD',
    }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar importación' }));

    expect(screen.getByRole('dialog', { name: 'Confirmar importación' })).toBeTruthy();
    expect((await repository.snapshot()).leads).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog', { name: 'Confirmar importación' })).toBeNull();
    expect((await repository.snapshot()).leads).toHaveLength(0);
  });
});
