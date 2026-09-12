import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ContextHelp } from '../../src/design/components/ContextHelp';

afterEach(cleanup);

describe('ContextHelp', () => {
  it('offers concise help through a labelled icon without duplicating the field label', async () => {
    const user = userEvent.setup();
    render(<ContextHelp label="Ayuda sobre la tasa de referencia">Solo cambia esta tasa cuando exista una fuente confirmada.</ContextHelp>);

    const help = screen.getByRole('button', { name: 'Ayuda sobre la tasa de referencia' });
    await user.tab();
    expect(screen.getByRole('tooltip').textContent).toContain('Solo cambia esta tasa cuando exista una fuente confirmada.');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(help).toBeTruthy();
  });
});
