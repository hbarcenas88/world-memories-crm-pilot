import { createActivityEvent } from '../../domain/events';
import type { Task } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type RescheduleTaskCommand = Readonly<{ taskId: string; dueOn: string; occurredAt: string; recordedAt: string }>;

export async function rescheduleTask(repository: WorkspaceRepository, command: RescheduleTaskCommand): Promise<{ task: Task; event: ReturnType<typeof createActivityEvent> }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.dueOn)) throw new Error('task due date is required');
  return repository.transact(async (tx) => {
    const current = await tx.getTask(command.taskId);
    if (!current) throw new Error('task not found');
    if (current.status === 'completed') throw new Error('completed task cannot be rescheduled');
    const task: Task = { ...current, dueOn: command.dueOn };
    const event = createActivityEvent({
      aggregateType: 'task', aggregateId: task.id, type: 'task_rescheduled', occurredAt: command.occurredAt, recordedAt: command.recordedAt,
      payload: { previousDueOn: current.dueOn ?? null, dueOn: task.dueOn },
    });
    await tx.putTask(task);
    await tx.putEvents([event]);
    return { task, event };
  });
}
