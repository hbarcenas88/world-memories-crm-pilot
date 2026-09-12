import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AccordionSection } from '../../src/design/components/AccordionSection';

afterEach(cleanup);

describe('AccordionSection', () => {
  it('keeps its content mounted while the user collapses and reopens it', async () => {
    const user = userEvent.setup();
    render(<AccordionSection summary="2 registros" title="Historial"><input aria-label="Nota de seguimiento" defaultValue="Conservar borrador" /></AccordionSection>);

    const trigger = screen.getByRole('button', { name: 'Historial' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByLabelText('Nota de seguimiento')).toBeTruthy();
    await user.click(trigger);
    expect((screen.getByLabelText('Nota de seguimiento') as HTMLInputElement).value).toBe('Conservar borrador');
  });
});
