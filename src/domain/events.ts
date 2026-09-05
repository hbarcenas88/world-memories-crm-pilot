import type { ActivityEvent } from './types';

export type ActivityEventInput = Readonly<Omit<ActivityEvent, 'id' | 'payload'> & {
  payload?: Record<string, unknown>;
}>;

export function createActivityEvent(input: ActivityEventInput): ActivityEvent {
  return {
    id: crypto.randomUUID(),
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    type: input.type,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    payload: input.payload ?? {},
  };
}
