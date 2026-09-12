import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskDetail } from '../../src/features/tasks/TaskDetail';

afterEach(cleanup);

describe('TaskDetail', () => {
  it('uses the shared reversible toast after completing a task from its full workspace', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const onReopen = vi.fn().mockResolvedValue(undefined);
    render(<TaskDetail
      onComplete={onComplete}
      onReopen={onReopen}
      onReschedule={vi.fn()}
      task={{ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-09-15', status: 'open', createdAt: '2026-09-01T10:00:00.000Z' }}
    />);

    await user.click(screen.getByRole('button', { name: 'Completar: Confirmar itinerario' }));
    expect((await screen.findByRole('status')).textContent).toContain('Tarea completada: Confirmar itinerario');
    await user.click(screen.getByRole('button', { name: 'Deshacer: Confirmar itinerario' }));
    expect(onReopen).toHaveBeenCalledWith('task-1');
  });

  it('does not expose completion or rescheduling while an archived task remains historical', () => {
    render(<TaskDetail
      onComplete={vi.fn()}
      onReopen={vi.fn()}
      onReschedule={vi.fn()}
      task={{ id: 'task-1', title: 'Seguimiento histórico', required: false, dueOn: '2026-09-15', status: 'open', archivedAt: '2026-09-10T10:00:00.000Z', createdAt: '2026-09-01T10:00:00.000Z' }}
    />);

    expect(screen.queryByRole('button', { name: /Completar/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reprogramar tarea' })).toBeNull();
  });
});
