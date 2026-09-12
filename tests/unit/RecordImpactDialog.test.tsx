import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { RecordImpactDialog } from '../../src/features/records/RecordImpactDialog';

describe('RecordImpactDialog', () => {
  afterEach(cleanup);
  it('recommends archiving but preserves an explicit deletion path when a record has dependencies', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'client', id: 'client-1' }, title: 'Familia Rivera', dependencies: [{ label: 'Viaje', count: 2 }, { label: 'Lead', count: 1 }], canDelete: false, fingerprint: 'preview-1' }}
      onArchive={onArchive}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
    />);

    expect(screen.getByRole('dialog', { name: 'Gestionar Familia Rivera' })).toBeTruthy();
    expect(screen.getByText(/2 Viajes y 1 Lead vinculados/)).toBeTruthy();
    expect(screen.getByText(/Recomendamos archivar/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Mejor archivar' }));
    expect(onArchive).toHaveBeenCalledOnce();
  });

  it('requires an explicit second confirmation before deleting a record with no dependencies', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta aislada', dependencies: [], canDelete: true, fingerprint: 'preview-2' }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={onDelete}
    />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/Esta acción es definitiva/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    expect(onDelete).toHaveBeenCalledWith({ removeOwnEvents: false, expectedFingerprint: 'preview-2' });
  });

  it('offers the optional removal of only the target activity events on the final confirmation', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'task', id: 'task-1' }, title: 'Confirmar hotel', dependencies: [{ label: 'Evento de actividad', count: 2 }], canDelete: false, fingerprint: 'preview-3' }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={onDelete}
    />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    const removeEvents = screen.getByRole('checkbox', { name: 'Eliminar también sus 2 eventos de actividad' });
    await user.click(removeEvents);
    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(onDelete).toHaveBeenCalledWith({ removeOwnEvents: true, expectedFingerprint: 'preview-3' });
  });

  it('keeps the confirmation open and explains when the protected action fails', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockRejectedValue(new Error('storage unavailable'));
    render(<RecordImpactDialog
      impact={{ target: { kind: 'provider', id: 'provider-1' }, title: 'Proveedor Uno', dependencies: [], canDelete: true, fingerprint: 'preview-4' }}
      onArchive={onArchive}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
    />);

    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'Gestionar Proveedor Uno' })).toBeTruthy();
    expect(screen.getByText('No fue posible completar la acción. Revisa el registro e inténtalo nuevamente.')).toBeTruthy();
  });

  it('returns to the updated impact when concurrency protection rejects a stale deletion', async () => {
    const user = userEvent.setup();
    const onRefreshImpact = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta', dependencies: [], canDelete: true, fingerprint: 'preview-stale' }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={vi.fn().mockRejectedValue(new Error('record impact changed; review the deletion again'))}
      onRefreshImpact={onRefreshImpact}
    />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(await screen.findByText('La información relacionada cambió. Revisa el impacto actualizado antes de eliminar.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(onRefreshImpact).toHaveBeenCalledOnce();
  });

  it('translates the impact decision while preserving the record title', () => {
    render(<LocaleProvider locale="en"><RecordImpactDialog
      impact={{ target: { kind: 'client', id: 'client-1' }, title: 'Rivera Family', dependencies: [{ label: 'Viaje', count: 2 }], canDelete: false, fingerprint: 'preview-5' }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
    /></LocaleProvider>);

    expect(screen.getByRole('dialog', { name: 'Manage Rivera Family' })).toBeTruthy();
    expect(screen.getByText(/2 Trips linked/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archive instead' })).toBeTruthy();
  });
});
