import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { filterTasks, groupTasks } from '../../src/features/tasks/taskBoardModel';
import { TaskBoard } from '../../src/features/tasks/TaskBoard';

describe('groupTasks', () => {
  afterEach(cleanup);

  it('orders open tasks into Vencidas, Hoy, Próximas and Sin fecha', () => {
    const groups = groupTasks([
      { id: 'future', title: 'Próxima', required: false, dueOn: '2026-08-28', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'undated', title: 'Sin fecha', required: false, status: 'open', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'overdue', title: 'Vencida', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'today', title: 'Hoy', required: false, dueOn: '2026-08-26', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'completed', title: 'Hecha', required: false, dueOn: '2026-08-25', status: 'completed', createdAt: '2026-08-20T00:00:00.000Z' },
    ], '2026-08-26');

    expect(groups.overdue.map((task) => task.id)).toEqual(['overdue']);
    expect(groups.today.map((task) => task.id)).toEqual(['today']);
    expect(groups.upcoming.map((task) => task.id)).toEqual(['future']);
    expect(groups.undated.map((task) => task.id)).toEqual(['undated']);
  });

  it('filters tasks independently by status, Trip, Provider and date interval', () => {
    const visible = filterTasks({
      tasks: [
        { id: 'matching', title: 'Confirmar reserva', required: false, dueOn: '2026-09-15', status: 'open', tripId: 'trip-1', serviceProviderId: 'component-1', createdAt: '2026-09-01T00:00:00.000Z' },
        { id: 'completed', title: 'Confirmar pago', required: false, dueOn: '2026-09-15', status: 'completed', tripId: 'trip-1', serviceProviderId: 'component-1', createdAt: '2026-09-01T00:00:00.000Z' },
        { id: 'other-provider', title: 'Enviar documento', required: false, dueOn: '2026-09-15', status: 'open', tripId: 'trip-1', serviceProviderId: 'component-2', createdAt: '2026-09-01T00:00:00.000Z' },
        { id: 'outside-range', title: 'Llamar', required: false, dueOn: '2026-10-01', status: 'open', tripId: 'trip-1', serviceProviderId: 'component-1', createdAt: '2026-09-01T00:00:00.000Z' },
      ],
      serviceProviders: [
        { id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-09-01T00:00:00.000Z' },
        { id: 'component-2', serviceId: 'service-2', providerId: 'provider-2', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-09-01T00:00:00.000Z' },
      ],
      filters: { status: 'open', tripId: 'trip-1', providerId: 'provider-1', from: '2026-09-01', to: '2026-09-30' },
    });

    expect(visible.map((task) => task.id)).toEqual(['matching']);
  });

  it('renders the operational queues and offers explicit completion and rescheduling', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onReschedule = vi.fn();
    render(<TaskBoard onComplete={onComplete} onReschedule={onReschedule} tasks={[{ id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} today="2026-08-26" />);

    expect(screen.getByRole('heading', { name: 'Vencidas' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Completar: Llamar a familia' }));
    fireEvent.change(screen.getByLabelText('Nueva fecha para Llamar a familia'), { target: { value: '29/08/2026' } });

    expect(onComplete).toHaveBeenCalledWith('task-1');
    expect(onReschedule).toHaveBeenCalledWith('task-1', '2026-08-29');
  });

  it('creates a dated manual task with an optional time from the Tasks module', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<TaskBoard onComplete={vi.fn()} onCreate={onCreate} onReschedule={vi.fn()} tasks={[]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    await user.type(screen.getByLabelText('Título de la tarea'), 'Confirmar itinerario');
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '15/09/2026' } });
    await user.type(screen.getByLabelText('Hora (opcional)'), '1430');
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Confirmar itinerario', dueOn: '2026-09-15', dueTime: '14:30' }));
  });

  it('applies the visible Tasks filters without changing the saved records', async () => {
    const user = userEvent.setup();
    render(<TaskBoard onComplete={vi.fn()} onReschedule={vi.fn()} providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-09-01T00:00:00.000Z' }]} serviceProviders={[{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-09-01T00:00:00.000Z' }]} tasks={[
      { id: 'provider-task', title: 'Confirmar habitaci\u00f3n', required: false, dueOn: '2026-09-15', status: 'open', serviceProviderId: 'component-1', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'other-task', title: 'Llamar al cliente', required: false, dueOn: '2026-09-15', status: 'open', createdAt: '2026-09-01T00:00:00.000Z' },
    ]} today="2026-09-01" />);

    await user.selectOptions(screen.getByLabelText('Proveedor de la tarea'), 'provider-1');

    expect(screen.getByText('Confirmar habitaci\u00f3n')).toBeTruthy();
    expect(screen.queryByText('Llamar al cliente')).toBeNull();
  });

  it('requires an explicit choice to keep or recalculate a manually adjusted template date', async () => {
    const user = userEvent.setup();
    const onResolveTemplateDateReview = vi.fn();
    render(<TaskBoard onComplete={vi.fn()} onResolveTemplateDateReview={onResolveTemplateDateReview} onReschedule={vi.fn()} tasks={[{ id: 'task-1', title: 'Confirmar habitaci\u00f3n', required: true, dueOn: '2026-09-09', status: 'open', source: 'provider_template', dueDateSource: 'manual', requiresManualDateReview: true, templateSnapshot: { title: 'Confirmar habitaci\u00f3n', required: true, relativeTo: 'trip_start', offsetDays: -2 }, createdAt: '2026-09-01T00:00:00.000Z' }]} today="2026-09-01" />);

    expect(screen.getByText('La fecha fue ajustada manualmente; rev\u00edsala antes de recalcularla.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Recalcular según Viaje: Confirmar habitación' }));

    expect(onResolveTemplateDateReview).toHaveBeenCalledWith('task-1', 'recalculate');
  });

  it('offers an explicit undo after a task is completed', async () => {
    const user = userEvent.setup();
    const completedTask = { id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'completed' as const, completedAt: '2026-08-26T09:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' };
    const onComplete = vi.fn().mockResolvedValue(completedTask);
    const onReopen = vi.fn();
    render(<TaskBoard onComplete={onComplete} onReopen={onReopen} onReschedule={vi.fn()} tasks={[{ ...completedTask, status: 'open', completedAt: undefined }]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Completar: Llamar a familia' }));
    await user.click(await screen.findByRole('button', { name: 'Deshacer: Llamar a familia' }));

    expect(onReopen).toHaveBeenCalledWith('task-1');
  });

  it('keeps archived tasks out of the active queue until the user explicitly asks to see them', async () => {
    const user = userEvent.setup();
    render(<TaskBoard onComplete={vi.fn()} onReschedule={vi.fn()} tasks={[
      { id: 'open-task', title: 'Confirmar reserva', required: false, status: 'open', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'archived-task', title: 'Seguimiento cerrado', required: false, status: 'open', archivedAt: '2026-08-26T00:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' },
    ]} today="2026-08-26" />);

    expect(screen.queryByText('Seguimiento cerrado')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(screen.getByText('Seguimiento cerrado')).toBeTruthy();
  });

  it('renders the completion undo notice in English without translating task titles', async () => {
    const user = userEvent.setup();
    const completedTask = { id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'completed' as const, completedAt: '2026-08-26T09:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' };
    render(<LocaleProvider locale="en"><TaskBoard onComplete={vi.fn().mockResolvedValue(completedTask)} onReopen={vi.fn()} onReschedule={vi.fn()} tasks={[{ ...completedTask, status: 'open', completedAt: undefined }]} today="2026-08-26" /></LocaleProvider>);

    await user.click(screen.getByRole('button', { name: 'Complete: Llamar a familia' }));
    expect(await screen.findByRole('complementary', { name: 'Recent action' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo: Llamar a familia' })).toBeTruthy();
  });
});
