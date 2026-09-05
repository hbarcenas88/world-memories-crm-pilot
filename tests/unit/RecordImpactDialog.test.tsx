import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { RecordImpactDialog } from '../../src/features/records/RecordImpactDialog';

describe('RecordImpactDialog', () => {
  afterEach(cleanup);
  it('recommends archiving and does not expose permanent deletion when a record has dependencies', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'client', id: 'client-1' }, title: 'Familia Rivera', dependencies: [{ label: 'Viaje', count: 2 }, { label: 'Lead', count: 1 }], canDelete: false }}
      onArchive={onArchive}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
    />);

    expect(screen.getByRole('dialog', { name: 'Gestionar Familia Rivera' })).toBeTruthy();
    expect(screen.getByText(/2 Viajes y 1 Lead vinculados/)).toBeTruthy();
    expect(screen.getByText(/Recomendamos archivar/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Eliminar definitivamente' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Archivar' }));
    expect(onArchive).toHaveBeenCalledOnce();
  });

  it('requires an explicit second confirmation before deleting a record with no dependencies', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RecordImpactDialog
      impact={{ target: { kind: 'lead', id: 'lead-1' }, title: 'Consulta aislada', dependencies: [], canDelete: true }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={onDelete}
    />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/Esta acción es definitiva/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('translates the impact decision while preserving the record title', () => {
    render(<LocaleProvider locale="en"><RecordImpactDialog
      impact={{ target: { kind: 'client', id: 'client-1' }, title: 'Rivera Family', dependencies: [{ label: 'Viaje', count: 2 }], canDelete: false }}
      onArchive={vi.fn()}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
    /></LocaleProvider>);

    expect(screen.getByRole('dialog', { name: 'Manage Rivera Family' })).toBeTruthy();
    expect(screen.getByText(/2 Trips linked/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy();
  });
});
