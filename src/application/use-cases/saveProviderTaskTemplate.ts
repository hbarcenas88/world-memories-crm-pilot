import { createActivityEvent } from "../../domain/events";
import type { ProviderTaskTemplate } from "../../domain/types";
import type { WorkspaceRepository } from "../ports";

type SaveProviderTaskTemplateCommand = Readonly<{
  id?: string;
  providerId: string;
  title: string;
  required: boolean;
  relativeTo: ProviderTaskTemplate["relativeTo"];
  offsetDays?: number;
  offsetMonths?: number;
  active: boolean;
  occurredAt: string;
  recordedAt: string;
}>;

export async function saveProviderTaskTemplate(
  repository: WorkspaceRepository,
  command: SaveProviderTaskTemplateCommand,
): Promise<ProviderTaskTemplate> {
  const title = command.title.trim();
  if (title === "") throw new Error("provider task template title is required");
  if (command.offsetDays !== undefined && !Number.isInteger(command.offsetDays))
    throw new Error("provider task template offset must be an integer");
  if (
    command.offsetMonths !== undefined &&
    !Number.isInteger(command.offsetMonths)
  )
    throw new Error("provider task template offset must be an integer");
  if (command.offsetDays !== undefined && command.offsetMonths !== undefined)
    throw new Error("provider task template offset must use one unit");
  return repository.transact(async (tx) => {
    const existing = command.id
      ? await tx
          .listProviderTaskTemplates(command.providerId)
          .then((items) => items.find((item) => item.id === command.id))
      : undefined;
    if (command.id && !existing)
      throw new Error("provider task template not found");
    const template: ProviderTaskTemplate = {
      id: command.id ?? crypto.randomUUID(),
      providerId: command.providerId,
      title,
      required: command.required,
      relativeTo: command.relativeTo,
      ...(command.offsetDays === undefined
        ? {}
        : { offsetDays: command.offsetDays }),
      ...(command.offsetMonths === undefined
        ? {}
        : { offsetMonths: command.offsetMonths }),
      active: command.active,
      createdAt: existing?.createdAt ?? command.recordedAt,
    };
    await tx.putProviderTaskTemplate(template);
    await tx.putEvents([
      createActivityEvent({
        aggregateType: "provider",
        aggregateId: command.providerId,
        type: existing
          ? "provider_task_template_updated"
          : "provider_task_template_created",
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
        payload: { templateId: template.id, active: template.active },
      }),
    ]);
    return template;
  });
}
