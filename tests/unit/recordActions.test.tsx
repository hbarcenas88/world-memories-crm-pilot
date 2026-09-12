import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordActions } from '../../src/features/records/RecordActions';

afterEach(cleanup);

describe('RecordActions', () => {
  it('loads an impact preview before offering the archive action for a related record', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const loadImpact = vi.fn().mockResolvedValue({ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta Rivera', dependencies: [{ label: 'Tarea', count: 1 }], canDelete: false });
    render(<RecordActions
      label="Acciones del lead Consulta Rivera"
      loadImpact={loadImpact}
      onArchive={onArchive}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
      target={{ kind: 'lead', id: 'lead-1' }}
    />);

    await user.click(screen.getByRole('button', { name: 'Acciones del lead Consulta Rivera' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));

    expect(loadImpact).toHaveBeenCalledWith({ kind: 'lead', id: 'lead-1' });
    expect(await screen.findByRole('dialog', { name: 'Gestionar Consulta Rivera' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Mejor archivar' }));
    expect(onArchive).toHaveBeenCalledWith({ kind: 'lead', id: 'lead-1' });
  });

  it('offers edit, restoration and the explicit deletion review for archived records', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const loadImpact = vi.fn().mockResolvedValue({ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta archivada', dependencies: [], canDelete: true, fingerprint: 'stable' });
    render(<RecordActions
      archived
      label="Acciones del lead archivado"
      loadImpact={loadImpact}
      onArchive={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
      onRestore={onRestore}
      target={{ kind: 'lead', id: 'lead-1' }}
    />);

    await user.click(screen.getByRole('button', { name: 'Acciones del lead archivado' }));
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Restaurar' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toBeTruthy();

    await user.click(screen.getByRole('menuitem', { name: 'Restaurar' }));
    expect(onRestore).toHaveBeenCalledWith({ kind: 'lead', id: 'lead-1' });

    await user.click(screen.getByRole('button', { name: 'Acciones del lead archivado' }));
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    expect(await screen.findByRole('dialog', { name: 'Gestionar Consulta archivada' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Archivar' })).toBeNull();
  });

  it('can expose lifecycle actions without duplicating an edit action owned by the record form', async () => {
    const user = userEvent.setup();
    render(<RecordActions
      label="Acciones del proveedor Hotel Aurora"
      loadImpact={vi.fn().mockResolvedValue({ target: { kind: 'provider', id: 'provider-1' }, title: 'Hotel Aurora', dependencies: [], canDelete: true })}
      onArchive={vi.fn()}
      onDelete={vi.fn()}
      target={{ kind: 'provider', id: 'provider-1' }}
    />);

    await user.click(screen.getByRole('button', { name: 'Acciones del proveedor Hotel Aurora' }));
    expect(screen.queryByRole('menuitem', { name: 'Editar' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Archivar o eliminar' })).toBeTruthy();
  });

  it('keeps an impact error visible and allows a deliberate retry', async () => {
    const user = userEvent.setup();
    const loadImpact = vi.fn().mockRejectedValueOnce(new Error('synthetic read failure')).mockResolvedValue({ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta Rivera', dependencies: [], canDelete: true, fingerprint: 'stable' });
    render(<RecordActions label="Acciones del lead Consulta Rivera" loadImpact={loadImpact} onArchive={vi.fn()} onDelete={vi.fn()} target={{ kind: 'lead', id: 'lead-1' }} />);

    await user.click(screen.getByRole('button', { name: 'Acciones del lead Consulta Rivera' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archivar o eliminar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('No fue posible cargar las relaciones');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('dialog', { name: 'Gestionar Consulta Rivera' })).toBeTruthy();
    expect(loadImpact).toHaveBeenCalledTimes(2);
  });
});
