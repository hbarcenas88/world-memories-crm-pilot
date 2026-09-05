import { createActivityEvent } from "../../domain/events";
import type { Task } from "../../domain/types";
import type { WorkspaceRepository } from "../ports";

type ManualTaskFields = Readonly<{
  title: string;
  dueOn: string;
  dueTime?: string;
  required: boolean;
  leadId?: string;
  tripId?: string;
  commissionId?: string;
}>;

type CreateManualTaskCommand = Readonly<
  ManualTaskFields & { occurredAt: string; recordedAt: string }
>;
type UpdateManualTaskCommand = Readonly<
  ManualTaskFields & { taskId: string; occurredAt: string; recordedAt: string }
>;

function validate(fields: ManualTaskFields): void {
  if (fields.title.trim() === "") throw new Error("task title is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.dueOn))
    throw new Error("task due date is required");
  if (fields.dueTime !== undefined && !/^\d{2}:\d{2}$/.test(fields.dueTime))
    throw new Error("task due time is invalid");
  if (
    [fields.leadId, fields.tripId, fields.commissionId].filter(Boolean).length >
    1
  )
    throw new Error("manual task has one optional link");
}

function fieldsForTask(
  fields: ManualTaskFields,
): Omit<Task, "id" | "status" | "createdAt"> {
  return {
    title: fields.title.trim(),
    required: fields.required,
    dueOn: fields.dueOn,
    ...(fields.dueTime ? { dueTime: fields.dueTime } : {}),
    ...(fields.leadId ? { leadId: fields.leadId } : {}),
    ...(fields.tripId ? { tripId: fields.tripId } : {}),
    ...(fields.commissionId ? { commissionId: fields.commissionId } : {}),
  };
}

export async function createManualTask(
  repository: WorkspaceRepository,
  command: CreateManualTaskCommand,
): Promise<Readonly<{ task: Task }>> {
  validate(command);
  return repository.transact(async (tx) => {
    const task: Task = {
      id: crypto.randomUUID(),
      ...fieldsForTask(command),
      source: "manual",
      dueDateSource: "manual",
      status: "open",
      createdAt: command.recordedAt,
    };
    await tx.putTask(task);
    await tx.putEvents([
      createActivityEvent({
        aggregateType: "task",
        aggregateId: task.id,
        type: "task_created_manually",
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: {
          leadId: task.leadId ?? null,
          tripId: task.tripId ?? null,
          commissionId: task.commissionId ?? null,
        },
      }),
    ]);
    return { task };
  });
}

export async function updateManualTask(
  repository: WorkspaceRepository,
  command: UpdateManualTaskCommand,
): Promise<Readonly<{ task: Task }>> {
  validate(command);
  return repository.transact(async (tx) => {
    const current = await tx.getTask(command.taskId);
    if (!current) throw new Error("task not found");
    const task: Task = {
      ...current,
      ...fieldsForTask(command),
      dueDateSource: "manual",
      requiresManualDateReview: false,
    };
    await tx.putTask(task);
    await tx.putEvents([
      createActivityEvent({
        aggregateType: "task",
        aggregateId: task.id,
        type: "task_updated_manually",
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: {
          previousDueOn: current.dueOn ?? null,
          dueOn: task.dueOn,
          previousDueTime: current.dueTime ?? null,
          dueTime: task.dueTime ?? null,
        },
      }),
    ]);
    return { task };
  });
}
