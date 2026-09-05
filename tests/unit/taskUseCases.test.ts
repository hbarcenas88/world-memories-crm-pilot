import { describe, expect, it } from "vitest";
import { completeTask } from "../../src/application/use-cases/completeTask";
import { reopenTask } from "../../src/application/use-cases/reopenTask";
import { rescheduleTask } from "../../src/application/use-cases/rescheduleTask";
import {
  createManualTask,
  updateManualTask,
} from "../../src/application/use-cases/manualTask";
import { MemoryWorkspaceRepository } from "../../src/test/memoryRepository";

const lead = {
  id: "lead-1",
  name: "MarÃ­a",
  status: "quote_sent" as const,
  createdAt: "2026-08-25T12:00:00.000Z",
  acquisitionSource: "Instagram",
  requestedDateStatus: "dates_to_define" as const,
};
const task = {
  id: "task-1",
  title: "Dar seguimiento a cotizaciÃ³n",
  required: false,
  dueOn: "2026-08-29",
  status: "open" as const,
  leadId: "lead-1",
  createdAt: "2026-08-25T12:00:00.000Z",
};

describe("lead task use cases", () => {
  it("creates and edits a manual task atomically with its audit events", async () => {
    const repository = new MemoryWorkspaceRepository();
    const created = await createManualTask(repository, {
      title: "Llamar a la familia",
      dueOn: "2026-09-15",
      dueTime: "14:30",
      required: false,
      occurredAt: "2026-09-01T10:00:00.000Z",
      recordedAt: "2026-09-01T10:00:00.000Z",
    });
    expect(created.task).toMatchObject({
      title: "Llamar a la familia",
      dueOn: "2026-09-15",
      dueTime: "14:30",
      source: "manual",
      status: "open",
    });
    const updated = await updateManualTask(repository, {
      taskId: created.task.id,
      title: "Confirmar llamada",
      dueOn: "2026-09-16",
      dueTime: "15:00",
      required: true,
      occurredAt: "2026-09-01T10:05:00.000Z",
      recordedAt: "2026-09-01T10:05:00.000Z",
    });
    expect(updated.task).toMatchObject({
      title: "Confirmar llamada",
      dueOn: "2026-09-16",
      dueTime: "15:00",
      required: true,
      source: "manual",
    });
    await expect(
      repository.listEventsForAggregate(created.task.id),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "task_created_manually" }),
        expect.objectContaining({ type: "task_updated_manually" }),
      ]),
    );
  });

  it("rejects a manual task linked to a Commission that does not exist", async () => {
    const repository = new MemoryWorkspaceRepository();

    await expect(
      createManualTask(repository, {
        title: "Revisar comisi\u00f3n",
        dueOn: "2026-09-15",
        required: false,
        commissionId: "commission-missing",
        occurredAt: "2026-09-01T10:00:00.000Z",
        recordedAt: "2026-09-01T10:00:00.000Z",
      }),
    ).rejects.toThrow("task commission not found");

    await expect(repository.listTasks()).resolves.toEqual([]);
  });

  it("reprograms a quote follow-up task and records the change atomically", async () => {
    const repository = new MemoryWorkspaceRepository(lead);
    await repository.seedTask(task);

    const result = await rescheduleTask(repository, {
      taskId: task.id,
      dueOn: "2026-09-01",
      occurredAt: "2026-08-27T09:00:00.000Z",
      recordedAt: "2026-08-27T09:01:00.000Z",
    });

    expect(result.task).toMatchObject({ dueOn: "2026-09-01", status: "open" });
    expect(result.event).toMatchObject({
      type: "task_rescheduled",
      aggregateId: task.id,
      occurredAt: "2026-08-27T09:00:00.000Z",
      recordedAt: "2026-08-27T09:01:00.000Z",
      payload: { previousDueOn: "2026-08-29", dueOn: "2026-09-01" },
    });
  });

  it("completes a quote follow-up task and retains the completion timestamp", async () => {
    const repository = new MemoryWorkspaceRepository(lead);
    await repository.seedTask(task);

    const result = await completeTask(repository, {
      taskId: task.id,
      occurredAt: "2026-08-27T09:00:00.000Z",
      recordedAt: "2026-08-27T09:01:00.000Z",
    });

    expect(result.task).toMatchObject({
      status: "completed",
      completedAt: "2026-08-27T09:00:00.000Z",
    });
    expect(result.event).toMatchObject({
      type: "task_completed",
      aggregateId: task.id,
      occurredAt: "2026-08-27T09:00:00.000Z",
      recordedAt: "2026-08-27T09:01:00.000Z",
    });
  });

  it("reopens a completed task and records an explicit undo event", async () => {
    const repository = new MemoryWorkspaceRepository(lead);
    await repository.seedTask({
      ...task,
      status: "completed",
      completedAt: "2026-08-27T09:00:00.000Z",
    });

    const result = await reopenTask(repository, {
      taskId: task.id,
      occurredAt: "2026-08-27T09:02:00.000Z",
      recordedAt: "2026-08-27T09:03:00.000Z",
    });

    expect(result.task).toMatchObject({ status: "open" });
    expect(result.task).not.toHaveProperty("completedAt");
    expect(result.event).toMatchObject({
      type: "task_reopened",
      aggregateId: task.id,
      occurredAt: "2026-08-27T09:02:00.000Z",
      recordedAt: "2026-08-27T09:03:00.000Z",
    });
  });
});
