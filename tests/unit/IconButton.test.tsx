import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Info } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { IconButton } from '../../src/design/components/IconButton';

describe('IconButton', () => {
  it('uses an accessible label and shows its contextual tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Ver ayuda de fechas"><Info aria-hidden="true" /></IconButton>);

    const button = screen.getByRole('button', { name: 'Ver ayuda de fechas' });
    await user.hover(button);

    expect(screen.getByRole('tooltip').textContent).toBe('Ver ayuda de fechas');
  });
});
