import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { LeadDetail } from '../../src/features/leads/LeadDetail';

afterEach(cleanup);

const lead = { id: 'lead-1', name: 'Familia Rivera', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' as const, status: 'contacted' as const, createdAt: '2026-08-25T12:00:00.000Z', destination: 'Japón' };

describe('LeadDetail', () => {
  it('shows the lead history and lets the operator move from contacted to quote preparation', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    render(<LeadDetail lead={lead} clients={[]} events={[{ id: 'event-1', aggregateType: 'lead', aggregateId: 'lead-1', type: 'lead_received', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }]} tasks={[]} onTransition={onTransition} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Familia Rivera' })).toBeTruthy();
    expect(screen.getByText('Consulta recibida')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Preparar cotización' }));

    expect(onTransition).toHaveBeenCalledWith('quote_preparing');
  });

  it('lets the operator complete or reprogram a suggested follow-up task', async () => {
    const user = userEvent.setup();
    const onCompleteTask = vi.fn();
    const onRescheduleTask = vi.fn();
    render(<LeadDetail lead={{ ...lead, status: 'quote_sent' }} clients={[]} events={[]} tasks={[{ id: 'task-1', title: 'Dar seguimiento a cotizaciÃ³n', required: false, dueOn: '2026-08-29', status: 'open', leadId: 'lead-1', createdAt: '2026-08-25T12:00:00.000Z' }]} onTransition={vi.fn()} onConvert={vi.fn()} onCompleteTask={onCompleteTask} onRescheduleTask={onRescheduleTask} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nueva fecha para Dar seguimiento a cotizaciÃ³n'), { target: { value: '01/09/2026' } });
    await user.click(screen.getByRole('button', { name: 'Completar' }));

    expect(onRescheduleTask).toHaveBeenCalledWith('task-1', '2026-09-01');
    expect(onCompleteTask).toHaveBeenCalledWith('task-1');
  });

  it('offers opening the same record as a full workspace', async () => {
    const user = userEvent.setup();
    const onOpenWorkspace = vi.fn();
    render(<LeadDetail lead={lead} clients={[]} events={[]} tasks={[]} onTransition={vi.fn()} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} onOpenWorkspace={onOpenWorkspace} />);

    await user.click(screen.getByRole('button', { name: 'Abrir expediente completo' }));
    expect(onOpenWorkspace).toHaveBeenCalledOnce();
  });

  it('collects an optional configured cancellation reason and note before cancelling', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    render(<LeadDetail cancellationReasons={[{ id: 'changed-plans', label: 'Cambió de planes', active: true }]} lead={lead} clients={[]} events={[]} tasks={[]} onTransition={onTransition} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar lead' }));
    await user.selectOptions(screen.getByLabelText('Motivo de cancelación'), 'changed-plans');
    await user.type(screen.getByLabelText('Nota de cancelación'), 'Viajará el próximo año');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect(onTransition).toHaveBeenCalledWith('cancelled', { cancellationReasonId: 'changed-plans', cancellationReasonNote: 'Viajará el próximo año' });
  });

  it('can add a cancellation reason in the cancellation flow and use it immediately', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    const onCreateCancellationReason = vi.fn().mockResolvedValue({ id: 'reason-budget', label: 'Presupuesto', active: true });
    render(<LeadDetail cancellationReasons={[]} lead={lead} clients={[]} events={[]} tasks={[]} onTransition={onTransition} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} onCreateCancellationReason={onCreateCancellationReason} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar lead' }));
    await user.type(screen.getByLabelText('Nuevo motivo de cancelación'), 'Presupuesto');
    await user.click(screen.getByRole('button', { name: 'Agregar motivo de cancelación' }));
    expect(onCreateCancellationReason).toHaveBeenCalledWith('Presupuesto');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect(onTransition).toHaveBeenCalledWith('cancelled', { cancellationReasonId: 'reason-budget' });
  });

  it('lets the operator discard or accept the suggested pause follow-up', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    render(<LeadDetail lead={lead} clients={[]} events={[]} tasks={[]} onTransition={onTransition} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Pausar lead' }));
    await user.click(screen.getByRole('button', { name: 'Crear tarea y pausar' }));

    expect(onTransition).toHaveBeenCalledWith('paused', { createPausedFollowUp: true });
  });

  it('translates activity and actions while preserving the lead name', () => {
    render(<LocaleProvider locale="en"><LeadDetail lead={lead} clients={[]} events={[{ id: 'event-1', aggregateType: 'lead', aggregateId: 'lead-1', type: 'lead_received', occurredAt: '2026-08-25T12:00:00.000Z', recordedAt: '2026-08-25T12:00:00.000Z', payload: {} }]} tasks={[]} onTransition={vi.fn()} onConvert={vi.fn()} onCompleteTask={vi.fn()} onRescheduleTask={vi.fn()} onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('heading', { name: 'Familia Rivera' })).toBeTruthy();
    expect(screen.getByText('Enquiry received')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prepare quote' })).toBeTruthy();
  });
});
