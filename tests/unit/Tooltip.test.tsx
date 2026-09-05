import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '../../src/design/components/Tooltip';

describe('Tooltip', () => {
  it('associates the help text with its trigger while it is visible', async () => {
    const user = userEvent.setup();
    render(<Tooltip label="Explica cuándo se usa este estado"><button type="button">Ayuda de estado</button></Tooltip>);

    await user.hover(screen.getByRole('button', { name: 'Ayuda de estado' }));

    const help = screen.getByRole('tooltip');
    expect(help.textContent).toBe('Explica cuándo se usa este estado');
    expect(screen.getByRole('button', { name: 'Ayuda de estado' }).getAttribute('aria-describedby')).toBe(help.id);
  });
});
