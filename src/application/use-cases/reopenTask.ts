import { createActivityEvent } from '../../domain/events';
import type { Task } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type ReopenTaskCommand = Readonly<{ taskId: string; occurredAt: string; recordedAt: string }>;

export async function reopenTask(repository: WorkspaceRepository, command: ReopenTaskCommand): Promise<{ task: Task; event: ReturnType<typeof createActivityEvent> }> {
  return repository.transact(async (tx) => {
    const current = await tx.getTask(command.taskId);
    if (!current) throw new Error('task not found');
    if (current.status !== 'completed') throw new Error('only completed task can be reopened');
    const { completedAt, ...openTask } = current;
    const task: Task = { ...openTask, status: 'open' };
    const event = createActivityEvent({
      aggregateType: 'task', aggregateId: task.id, type: 'task_reopened', occurredAt: command.occurredAt, recordedAt: command.recordedAt,
      payload: { previousCompletedAt: completedAt ?? null },
    });
    await tx.putTask(task);
    await tx.putEvents([event]);
    return { task, event };
  });
}
