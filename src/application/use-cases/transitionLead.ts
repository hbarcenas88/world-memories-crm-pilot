import { addDays, formatISO } from 'date-fns';
import { transitionLead as transitionLeadModel } from '../../domain/lead';
import type { LeadStatus, Task, TaskDraft } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

function followUpSuggestion(occurredAt: string, title: string): TaskDraft {
  return {
    title,
    required: false,
    dueOn: formatISO(addDays(new Date(occurredAt), 4), { representation: 'date' }),
  };
}

export async function transitionLead(repository: WorkspaceRepository, command: { leadId: string; to: LeadStatus; occurredAt: string; recordedAt: string; payload?: Record<string, unknown>; suggestedTaskTitle?: string; pausedTaskTitle?: string; createPausedFollowUp?: boolean }) {
  return repository.transact(async (tx) => {
    const lead = await tx.getLead(command.leadId);
    if (!lead) throw new Error('lead not found');

    const result = transitionLeadModel(lead, command.to, command.occurredAt, command.payload, command.pausedTaskTitle ? { title: command.pausedTaskTitle, required: false } : undefined);
    const event = { ...result.event, recordedAt: command.recordedAt };
    const suggestedTask = result.suggestedTask ?? (command.to === 'quote_sent' && command.suggestedTaskTitle ? followUpSuggestion(command.occurredAt, command.suggestedTaskTitle) : undefined);
    await tx.putLead(result.lead);
    await tx.putEvents([event]);
    if (command.to === 'quote_sent' && suggestedTask?.dueOn) {
      const task: Task = { id: crypto.randomUUID(), title: suggestedTask.title, required: suggestedTask.required, dueOn: suggestedTask.dueOn, status: 'open', leadId: lead.id, createdAt: command.recordedAt };
      await tx.putTask(task);
    }
    if (command.to === 'paused' && command.createPausedFollowUp && suggestedTask) {
      const task: Task = { id: crypto.randomUUID(), title: suggestedTask.title, required: suggestedTask.required, status: 'open', leadId: lead.id, source: 'lead_follow_up', createdAt: command.recordedAt };
      await tx.putTask(task);
    }
    return { lead: result.lead, event, suggestedTask };
  });
}
