import { createActivityEvent } from '../../domain/events';
import type { Task } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type CompleteTaskCommand = Readonly<{ taskId: string; occurredAt: string; recordedAt: string }>;

export async function completeTask(repository: WorkspaceRepository, command: CompleteTaskCommand): Promise<{ task: Task; event: ReturnType<typeof createActivityEvent> }> {
  return repository.transact(async (tx) => {
    const current = await tx.getTask(command.taskId);
    if (!current) throw new Error('task not found');
    if (current.status === 'completed') throw new Error('task already completed');
    const task: Task = { ...current, status: 'completed', completedAt: command.occurredAt };
    const event = createActivityEvent({
      aggregateType: 'task', aggregateId: task.id, type: 'task_completed', occurredAt: command.occurredAt, recordedAt: command.recordedAt,
      payload: { leadId: task.leadId ?? null, tripId: task.tripId ?? null },
    });
    await tx.putTask(task);
    await tx.putEvents([event]);
    return { task, event };
  });
}
