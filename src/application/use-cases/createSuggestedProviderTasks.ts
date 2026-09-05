import { createActivityEvent } from "../../domain/events";
import type { Task } from "../../domain/types";
import type { WorkspaceRepository } from "../ports";

type SuggestedProviderTask = Readonly<{
  templateId?: string;
  title: string;
  required: boolean;
  dueOn?: string;
  templateSnapshot?: Task["templateSnapshot"];
}>;

type CreateSuggestedProviderTasksCommand = Readonly<{
  tripId: string;
  serviceProviderId: string;
  selectedTemplates: readonly SuggestedProviderTask[];
  occurredAt: string;
  recordedAt: string;
}>;

export async function createSuggestedProviderTasks(
  repository: WorkspaceRepository,
  command: CreateSuggestedProviderTasksCommand,
): Promise<Readonly<{ tasks: readonly Task[] }>> {
  return repository.transact(async (tx) => {
    const component = await tx.getServiceProvider(command.serviceProviderId);
    const service = component
      ? await tx.getService(component.serviceId)
      : undefined;
    if (!component || !service) throw new Error("service provider not found");
    if (service.tripId !== command.tripId)
      throw new Error("service provider does not belong to trip");
    const tasks = command.selectedTemplates.map((template) => {
      const title = template.title.trim();
      if (!title) throw new Error("suggested task title is required");
      return {
        id: crypto.randomUUID(),
        title,
        required: template.required,
        ...(template.dueOn
          ? { dueOn: template.dueOn, dueDateSource: "template" as const }
          : {}),
        tripId: command.tripId,
        serviceProviderId: command.serviceProviderId,
        ...(template.templateId ? { templateId: template.templateId } : {}),
        ...(template.templateSnapshot
          ? { templateSnapshot: template.templateSnapshot }
          : {}),
        source: "provider_template" as const,
        status: "open" as const,
        createdAt: command.recordedAt,
      };
    });
    for (const task of tasks) await tx.putTask(task);
    if (tasks.length > 0)
      await tx.putEvents([
        createActivityEvent({
          aggregateType: "trip",
          aggregateId: command.tripId,
          type: "provider_template_tasks_created",
          occurredAt: command.occurredAt,
          recordedAt: command.recordedAt,
          payload: {
            serviceProviderId: command.serviceProviderId,
            taskIds: tasks.map((task) => task.id),
          },
        }),
      ]);
    return { tasks };
  });
}
