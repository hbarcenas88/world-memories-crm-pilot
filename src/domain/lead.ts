import { createActivityEvent } from './events';
import type { ActivityEvent, Lead, LeadDraft, LeadStatus, TaskDraft } from './types';

const transitions: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  new: ['contacted', 'quote_preparing', 'paused', 'cancelled'],
  contacted: ['quote_preparing', 'paused', 'cancelled'],
  quote_preparing: ['quote_sent', 'paused', 'cancelled'],
  quote_sent: ['follow_up', 'review_adjustments', 'paused', 'cancelled'],
  follow_up: ['review_adjustments', 'paused', 'cancelled'],
  review_adjustments: ['quote_sent', 'paused', 'cancelled'],
  paused: ['follow_up', 'review_adjustments'],
  sold: [],
  cancelled: ['follow_up', 'review_adjustments'],
};

function event(leadId: string, type: string, now: string, payload?: Record<string, unknown>): ActivityEvent {
  return createActivityEvent({ aggregateType: 'lead', aggregateId: leadId, type, occurredAt: now, recordedAt: now, payload });
}

export function createLead(draft: LeadDraft, now: string): { lead: Lead; events: ActivityEvent[] } {
  const status = draft.initialStatus ?? 'new';
  const lead: Lead = { ...draft, id: crypto.randomUUID(), status, createdAt: now };
  const events = [event(lead.id, 'lead_received', now)];
  if (status === 'contacted') events.push(event(lead.id, 'lead_contacted', now));
  return { lead, events };
}

export function transitionLead(lead: Lead, to: LeadStatus, now: string, payload?: Record<string, unknown>, pausedTask?: TaskDraft): { lead: Lead; event: ActivityEvent; suggestedTask?: TaskDraft } {
  if (!transitions[lead.status].includes(to)) throw new Error('invalid lead transition');
  const cancellation = to === 'cancelled'
    ? {
        ...(typeof payload?.cancellationReasonId === 'string' ? { cancellationReasonId: payload.cancellationReasonId } : {}),
        ...(typeof payload?.cancellationReasonNote === 'string' ? { cancellationReasonNote: payload.cancellationReasonNote } : {}),
      }
    : {};
  const next = { ...lead, status: to, ...cancellation };
  const eventType = to === 'quote_sent' ? 'quote_sent' : `lead_${to}`;
  return { lead: next, event: event(lead.id, eventType, now, { fromStatus: lead.status, toStatus: to, ...payload }), ...(to === 'paused' && pausedTask ? { suggestedTask: pausedTask } : {}) };
}
