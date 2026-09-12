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
    await user.click(screen.getByRole('button', { name: 'Reprogramar tarea' }));
    fireEvent.change(screen.getByLabelText('Nueva fecha para Llamar a familia'), { target: { value: '29/08/2026' } });
    expect(onReschedule).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Aplicar fecha' }));

    expect(onComplete).toHaveBeenCalledWith('task-1');
    expect(onReschedule).toHaveBeenCalledWith('task-1', '2026-08-29');
  });

  it('keeps the selected date visible when rescheduling cannot be persisted', async () => {
    const user = userEvent.setup();
    const onReschedule = vi.fn().mockRejectedValue(new Error('synthetic storage failure'));
    render(<TaskBoard onComplete={vi.fn()} onReschedule={onReschedule} tasks={[{ id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'open', createdAt: '2026-08-20T00:00:00.000Z' }]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Reprogramar tarea' }));
    fireEvent.change(screen.getByLabelText('Nueva fecha para Llamar a familia'), { target: { value: '29/08/2026' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar fecha' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No fue posible guardar la tarea. Revisa los datos e inténtalo nuevamente.');
    expect((screen.getByLabelText('Nueva fecha para Llamar a familia') as HTMLInputElement).value).toBe('29/08/2026');
  });

  it('creates a dated manual task with an optional time from the Tasks module', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<TaskBoard onComplete={vi.fn()} onCreate={onCreate} onReschedule={vi.fn()} tasks={[]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Nueva tarea' })).toBeTruthy();
    await user.type(screen.getByLabelText('Título de la tarea'), 'Confirmar itinerario');
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '15/09/2026' } });
    await user.type(screen.getByLabelText('Hora (opcional)'), '1430');
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Confirmar itinerario', dueOn: '2026-09-15', dueTime: '14:30' }));
  });

  it('keeps a task draft open with its values when persistence fails', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error('synthetic storage failure'));
    render(<TaskBoard onComplete={vi.fn()} onCreate={onCreate} onReschedule={vi.fn()} tasks={[]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    await user.type(screen.getByLabelText('Título de la tarea'), 'Confirmar itinerario');
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '15/09/2026' } });
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No fue posible guardar la tarea. Revisa los datos e inténtalo nuevamente.');
    expect((screen.getByLabelText('Título de la tarea') as HTMLInputElement).value).toBe('Confirmar itinerario');
  });

  it('does not save the previous task date when the visible replacement is invalid', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TaskBoard onComplete={vi.fn()} onEdit={onEdit} onReschedule={vi.fn()} tasks={[{ id: 'task-1', title: 'Confirmar itinerario', required: false, dueOn: '2026-09-15', status: 'open', createdAt: '2026-09-01T00:00:00.000Z' }]} today="2026-09-01" />);

    await user.click(screen.getByRole('button', { name: 'Editar tarea' }));
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '31/02/2026' } });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Escribe una fecha válida en formato DD/MM/AAAA.');
  });

  it('asks before cancelling a manual task with unsaved changes', async () => {
    const user = userEvent.setup();
    render(<TaskBoard onComplete={vi.fn()} onCreate={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    await user.type(screen.getByLabelText('Título de la tarea'), 'Confirmar itinerario');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
  });

  it('applies the visible Tasks filters without changing the saved records', async () => {
    const user = userEvent.setup();
    render(<TaskBoard onComplete={vi.fn()} onReschedule={vi.fn()} providers={[{ id: 'provider-1', name: 'Hotel Aurora', status: 'active', allowedCurrencies: ['USD'], createdAt: '2026-09-01T00:00:00.000Z' }]} serviceProviders={[{ id: 'component-1', serviceId: 'service-1', providerId: 'provider-1', currency: 'USD', commissionStatus: 'with_commission', createdAt: '2026-09-01T00:00:00.000Z' }]} tasks={[
      { id: 'provider-task', title: 'Confirmar habitaci\u00f3n', required: false, dueOn: '2026-09-15', status: 'open', serviceProviderId: 'component-1', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'other-task', title: 'Llamar al cliente', required: false, dueOn: '2026-09-15', status: 'open', createdAt: '2026-09-01T00:00:00.000Z' },
    ]} today="2026-09-01" />);

    await user.click(screen.getByRole('button', { name: 'Filtrar tareas' }));
    await user.selectOptions(screen.getByLabelText('Proveedor de la tarea'), 'provider-1');

    expect(screen.getByText('Confirmar habitaci\u00f3n')).toBeTruthy();
    expect(screen.queryByText('Llamar al cliente')).toBeNull();
  });

  it('keeps task records visible and explains an inverted date range instead of silently applying it', async () => {
    const user = userEvent.setup();
    render(<TaskBoard onComplete={vi.fn()} onReschedule={vi.fn()} tasks={[{ id: 'task-1', title: 'Confirmar reserva', required: false, dueOn: '2026-09-15', status: 'open', createdAt: '2026-09-01T00:00:00.000Z' }]} today="2026-09-01" />);

    await user.click(screen.getByRole('button', { name: 'Filtrar tareas' }));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '30/09/2026' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '01/09/2026' } });

    expect(screen.getByRole('alert').textContent).toBe('La fecha Desde debe ser anterior o igual a Hasta.');
    expect(screen.getByText('Confirmar reserva')).toBeTruthy();
  });

  it('uses a readable trip context rather than exposing a trip ID in the filter', async () => {
    const user = userEvent.setup();
    render(<TaskBoard clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-09-01T00:00:00.000Z' }]} onComplete={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-09-01" trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-15', createdAt: '2026-09-01T00:00:00.000Z' }]} />);

    await user.click(screen.getByRole('button', { name: 'Filtrar tareas' }));
    expect(screen.getByRole('option', { name: 'Viaje · Familia Rivera · 15/09/2026' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'trip-1' })).toBeNull();
  });

  it('keeps a deleted Client explicit in the Trip context instead of replacing it with an unnamed fallback', async () => {
    const user = userEvent.setup();
    render(<TaskBoard clients={[]} deletedReferences={[{ key: 'client:client-deleted', kind: 'client', id: 'client-deleted', displayLabel: 'Familia histórica', deletedAt: '2026-09-07T10:00:00.000Z', eventDisposition: 'kept' }]} onComplete={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-09-01" trips={[{ id: 'trip-historical', leadId: 'lead-1', clientId: 'client-deleted', status: 'active', effectiveStartOn: '2026-09-15', createdAt: '2026-09-01T00:00:00.000Z' }]} />);

    await user.click(screen.getByRole('button', { name: 'Filtrar tareas' }));
    expect(screen.getByRole('option', { name: 'Viaje · Registro eliminado: Familia histórica · 15/09/2026' })).toBeTruthy();
  });

  it('keeps that historical Client context when manually linking a new Task to its surviving Trip', async () => {
    const user = userEvent.setup();
    render(<TaskBoard clients={[]} deletedReferences={[{ key: 'client:client-deleted', kind: 'client', id: 'client-deleted', displayLabel: 'Familia histórica', deletedAt: '2026-09-07T10:00:00.000Z', eventDisposition: 'kept' }]} onComplete={vi.fn()} onCreate={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-09-01" trips={[{ id: 'trip-historical', leadId: 'lead-1', clientId: 'client-deleted', status: 'active', effectiveStartOn: '2026-09-15', createdAt: '2026-09-01T00:00:00.000Z' }]} />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    expect(screen.getByRole('option', { name: 'Viaje: Viaje · Registro eliminado: Familia histórica · 15/09/2026' })).toBeTruthy();
  });

  it('keeps a deleted Trip explicit when a new Task is linked to its surviving Commission', async () => {
    const user = userEvent.setup();
    render(<TaskBoard clients={[]} commissions={[{ id: 'commission-historical', tripId: 'trip-deleted', providerId: 'provider-1', expected: { amount: 100, currency: 'USD' }, status: 'expected', createdAt: '2026-09-01T00:00:00.000Z' }]} deletedReferences={[{ key: 'trip:trip-deleted', kind: 'trip', id: 'trip-deleted', displayLabel: 'Viaje histórico', deletedAt: '2026-09-07T10:00:00.000Z', eventDisposition: 'kept' }]} onComplete={vi.fn()} onCreate={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-09-01" trips={[]} />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    expect(screen.getByRole('option', { name: 'Comisión: Registro eliminado: Viaje histórico' })).toBeTruthy();
  });

  it('uses the same readable trip context in a manual task link selector', async () => {
    const user = userEvent.setup();
    render(<TaskBoard clients={[{ id: 'client-1', name: 'Familia Rivera', createdAt: '2026-09-01T00:00:00.000Z' }]} onComplete={vi.fn()} onCreate={vi.fn()} onReschedule={vi.fn()} tasks={[]} today="2026-09-01" trips={[{ id: 'trip-1', leadId: 'lead-1', clientId: 'client-1', status: 'active', effectiveStartOn: '2026-09-15', createdAt: '2026-09-01T00:00:00.000Z' }]} />);

    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    expect(screen.getByRole('option', { name: 'Viaje: Viaje · Familia Rivera · 15/09/2026' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Viaje: trip-1' })).toBeNull();
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
    expect((await screen.findByRole('status')).textContent).toContain('Tarea completada: Llamar a familia');
    await user.click(await screen.findByRole('button', { name: 'Deshacer: Llamar a familia' }));

    expect(onReopen).toHaveBeenCalledWith('task-1');
  });

  it('offers an inverse undo after a completed task is reopened', async () => {
    const user = userEvent.setup();
    const task = { id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'completed' as const, completedAt: '2026-08-26T09:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' };
    const onComplete = vi.fn();
    const onReopen = vi.fn().mockResolvedValue(undefined);
    render(<TaskBoard onComplete={onComplete} onReopen={onReopen} onReschedule={vi.fn()} tasks={[task]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Filtrar tareas' }));
    await user.selectOptions(screen.getByLabelText('Estado de la tarea'), 'completed');
    await user.click(screen.getByRole('button', { name: 'Reabrir tarea' }));

    expect((await screen.findByRole('status')).textContent).toContain('Tarea reabierta: Llamar a familia');
    await user.click(screen.getByRole('button', { name: 'Deshacer: Llamar a familia' }));
    expect(onComplete).toHaveBeenCalledWith('task-1');
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

  it('does not expose completion or inline rescheduling for an archived task', async () => {
    const user = userEvent.setup();
    render(<TaskBoard loadImpact={vi.fn().mockResolvedValue({ target: { kind: 'task', id: 'archived-task' }, title: 'Seguimiento cerrado', dependencies: [], canDelete: true })} onArchive={vi.fn()} onComplete={vi.fn()} onDelete={vi.fn()} onReschedule={vi.fn()} onRestore={vi.fn()} tasks={[{ id: 'archived-task', title: 'Seguimiento cerrado', required: false, dueOn: '2026-08-30', status: 'open', archivedAt: '2026-08-26T00:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' }]} today="2026-08-26" />);

    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(screen.queryByRole('button', { name: 'Completar: Seguimiento cerrado' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Nueva fecha para Seguimiento cerrado' })).toBeNull();
  });

  it('renders the completion undo notice in English without translating task titles', async () => {
    const user = userEvent.setup();
    const completedTask = { id: 'task-1', title: 'Llamar a familia', required: false, dueOn: '2026-08-25', status: 'completed' as const, completedAt: '2026-08-26T09:00:00.000Z', createdAt: '2026-08-20T00:00:00.000Z' };
    render(<LocaleProvider locale="en"><TaskBoard onComplete={vi.fn().mockResolvedValue(completedTask)} onReopen={vi.fn()} onReschedule={vi.fn()} tasks={[{ ...completedTask, status: 'open', completedAt: undefined }]} today="2026-08-26" /></LocaleProvider>);

    await user.click(screen.getByRole('button', { name: 'Complete: Llamar a familia' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo: Llamar a familia' })).toBeTruthy();
  });
});
