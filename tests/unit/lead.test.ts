import { describe, expect, it } from 'vitest';
import { createLead, transitionLead } from '../../src/domain/lead';

const now = '2026-08-25T12:00:00.000Z';

describe('createLead', () => {
  it('records both receipt and contact when a lead is captured after the first conversation', () => {
    const result = createLead(
      { name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define', initialStatus: 'contacted' },
      now,
    );

    expect(result.lead.status).toBe('contacted');
    expect(result.events.map((event) => event.type)).toEqual(['lead_received', 'lead_contacted']);
  });
});

describe('transitionLead', () => {
  it('records a quote-sent event only when the user explicitly marks it as sent', () => {
    const { lead } = createLead({ name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);

    const result = transitionLead(lead, 'contacted', now);
    const quote = transitionLead(result.lead, 'quote_preparing', now);
    const sent = transitionLead(quote.lead, 'quote_sent', now);

    expect(sent.event.type).toBe('quote_sent');
  });

  it('offers an optional follow-up task when pausing without creating it automatically', () => {
    const { lead } = createLead({ name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);

    const paused = transitionLead(lead, 'paused', now, undefined, { title: 'Retomar lead pausado', required: false });

    expect(paused.suggestedTask).toMatchObject({ title: 'Retomar lead pausado', required: false });
  });

  it('rejects a transition from a new lead directly to sold', () => {
    const { lead } = createLead({ name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);

    expect(() => transitionLead(lead, 'sold', now)).toThrow('invalid lead transition');
  });

  it('keeps the optional cancellation reason and note on the cancelled lead and its event', () => {
    const { lead } = createLead({ name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);

    const cancelled = transitionLead(lead, 'cancelled', now, { cancellationReasonId: 'client_cancelled', cancellationReasonNote: 'Cambió de planes' });

    expect(cancelled.lead).toMatchObject({ status: 'cancelled', cancellationReasonId: 'client_cancelled', cancellationReasonNote: 'Cambió de planes' });
    expect(cancelled.event).toMatchObject({ type: 'lead_cancelled', payload: { fromStatus: 'new', toStatus: 'cancelled', cancellationReasonId: 'client_cancelled' } });
  });

  it('records the previous and next statuses when a Lead is paused and later reactivated', () => {
    const { lead } = createLead({ name: 'MarÃ­a', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);
    const paused = transitionLead(lead, 'paused', now);
    const reactivated = transitionLead(paused.lead, 'follow_up', now);

    expect(paused.event.payload).toMatchObject({ fromStatus: 'new', toStatus: 'paused' });
    expect(reactivated.event.payload).toMatchObject({ fromStatus: 'paused', toStatus: 'follow_up' });
  });

  it('allows a follow-up after a sent quote and then explicit cancellation', () => {
    const { lead } = createLead({ name: 'María', acquisitionSource: 'Instagram', requestedDateStatus: 'dates_to_define' }, now);
    const contacted = transitionLead(lead, 'contacted', now);
    const preparing = transitionLead(contacted.lead, 'quote_preparing', now);
    const sent = transitionLead(preparing.lead, 'quote_sent', now);
    const followedUp = transitionLead(sent.lead, 'follow_up', now);
    const cancelled = transitionLead(followedUp.lead, 'cancelled', now);

    expect(followedUp.event.type).toBe('lead_follow_up');
    expect(cancelled.lead.status).toBe('cancelled');
  });
});
