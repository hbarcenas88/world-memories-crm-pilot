import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Tooltip } from '../../src/design/components/Tooltip';

describe('Tooltip', () => {
  afterEach(cleanup);
  it('associates the help text with its trigger while it is visible', async () => {
    const user = userEvent.setup();
    render(<Tooltip label="Explica cuándo se usa este estado"><button type="button">Ayuda de estado</button></Tooltip>);

    await user.hover(screen.getByRole('button', { name: 'Ayuda de estado' }));

    const help = screen.getByRole('tooltip');
    expect(help.textContent).toBe('Explica cuándo se usa este estado');
    expect(screen.getByRole('button', { name: 'Ayuda de estado' }).getAttribute('aria-describedby')).toBe(help.id);
  });

  it('closes with Escape without activating its trigger', async () => {
    const user = userEvent.setup();
    render(<Tooltip label="Ayuda breve"><button type="button">Ayuda</button></Tooltip>);
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ayuda' }));
  });

  it('uses the viewport layer so an ancestor cannot crop a focused explanation', async () => {
    const user = userEvent.setup();
    render(<div style={{ overflow: 'hidden' }}><Tooltip label="Ayuda visible"><button type="button">Ayuda</button></Tooltip></div>);

    await user.tab();
    const help = screen.getByRole('tooltip');
    expect(help.parentElement).toBe(document.body);
    expect(help.style.position).toBe('fixed');
    expect(help.dataset.placement).toBe('bottom');
  });
});
