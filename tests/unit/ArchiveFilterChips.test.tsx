import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveFilterChips } from '../../src/design/components/ArchiveFilterChips';

describe('ArchiveFilterChips', () => {
  it('offers active, archived and all filters with an explicit selected state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ArchiveFilterChips onChange={onChange} value="active" />);

    expect(screen.getByRole('button', { name: 'Activos' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(onChange).toHaveBeenCalledWith('archived');
  });
});
