import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientList } from '../../src/features/clients/ClientList';

describe('ClientList', () => {
  afterEach(cleanup);
  it('shows active and archived families together through Todos', async () => {
    const user = userEvent.setup();
    render(<ClientList onSelect={vi.fn()} clients={[
      { id: 'active', name: 'Familia activa', createdAt: '2026-08-29T00:00:00.000Z' },
      { id: 'archived', name: 'Familia archivada', createdAt: '2026-08-29T00:00:00.000Z', archivedAt: '2026-08-29T01:00:00.000Z' },
    ]} />);

    await user.click(screen.getByRole('button', { name: 'Todos' }));
    expect(screen.getByText('Familia activa')).toBeTruthy();
    expect(screen.getByText('Familia archivada')).toBeTruthy();
  });
  it('keeps archived clients available through an explicit archive filter', async () => {
    const user = userEvent.setup();
    render(<ClientList
      clients={[
        { id: 'active', name: 'Familia activa', createdAt: '2026-08-29T00:00:00.000Z' },
        { id: 'archived', name: 'Familia archivada', createdAt: '2026-08-29T00:00:00.000Z', archivedAt: '2026-08-29T01:00:00.000Z' },
      ]}
      onSelect={vi.fn()}
    />);

    expect(screen.getByText('Familia activa')).toBeTruthy();
    expect(screen.queryByText('Familia archivada')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(screen.getByText('Familia archivada')).toBeTruthy();
    expect(screen.getByText('Archivado')).toBeTruthy();
  });
});
