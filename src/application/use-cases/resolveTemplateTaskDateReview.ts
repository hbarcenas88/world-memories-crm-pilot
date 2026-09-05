import { createActivityEvent } from '../../domain/events';
import type { Task, Trip } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type ResolveTemplateTaskDateReviewCommand = Readonly<{
  taskId: string;
  decision: 'keep_manual' | 'recalculate';
  occurredAt: string;
  recordedAt: string;
}>;

function addTemplateOffset(isoDate: string, days?: number, months?: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (months) date.setUTCMonth(date.getUTCMonth() + months);
  if (days) date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dueOnForTemplate(task: Task, trip: Trip | undefined): string | undefined {
  if (!task.templateSnapshot) return undefined;
  const anchor = task.templateSnapshot.relativeTo === 'trip_start'
    ? trip?.effectiveStartOn
    : task.templateSnapshot.relativeTo === 'trip_end'
      ? trip?.effectiveEndOn
      : undefined;
  return anchor ? addTemplateOffset(anchor, task.templateSnapshot.offsetDays, task.templateSnapshot.offsetMonths) : undefined;
}

function withoutDueOn(task: Task): Task {
  const next = { ...task } as { dueOn?: string } & Task;
  delete next.dueOn;
  return next;
}

export async function resolveTemplateTaskDateReview(repository: WorkspaceRepository, command: ResolveTemplateTaskDateReviewCommand): Promise<Readonly<{ task: Task }>> {
  return repository.transact(async (tx) => {
    const task = await tx.getTask(command.taskId);
    if (!task) throw new Error('task not found');
    if (task.source !== 'provider_template' || !task.templateSnapshot || !task.requiresManualDateReview) throw new Error('task does not require template date review');
    const dueOn = command.decision === 'recalculate' ? dueOnForTemplate(task, task.tripId ? await tx.getTrip(task.tripId) : undefined) : task.dueOn;
    const updated: Task = dueOn
      ? { ...task, dueOn, dueDateSource: command.decision === 'recalculate' ? 'template' : 'manual', requiresManualDateReview: false }
      : { ...withoutDueOn(task), dueDateSource: 'template', requiresManualDateReview: false };
    await tx.putTask(updated);
    await tx.putEvents([createActivityEvent({
      aggregateType: 'task',
      aggregateId: task.id,
      type: 'task_template_date_review_resolved',
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
      payload: { decision: command.decision, dueOn: updated.dueOn ?? null },
    })]);
    return { task: updated };
  });
}
