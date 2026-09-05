import { describe, expect, it } from 'vitest';
import { createActivityEvent } from '../../src/domain/events';

describe('createActivityEvent', () => {
  it('preserves an effective historical time separately from the time it was recorded', () => {
    const event = createActivityEvent({
      aggregateType: 'lead',
      aggregateId: 'lead-1',
      type: 'quote_sent',
      occurredAt: '2026-07-20T15:00:00.000Z',
      recordedAt: '2026-08-25T12:00:00.000Z',
    });

    expect(event).toMatchObject({
      aggregateType: 'lead',
      aggregateId: 'lead-1',
      type: 'quote_sent',
      occurredAt: '2026-07-20T15:00:00.000Z',
      recordedAt: '2026-08-25T12:00:00.000Z',
      payload: {},
    });
    expect(event.id).toEqual(expect.any(String));
  });
});
