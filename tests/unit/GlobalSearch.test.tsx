import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlobalSearch } from '../../src/features/search/GlobalSearch';

describe('GlobalSearch', () => {
  afterEach(cleanup);

  it('dismisses visible results when the operator clicks outside search', async () => {
    const user = userEvent.setup();
    render(<><GlobalSearch clients={[]} commissions={[]} leads={[{ id: 'lead-1', name: 'Familia Rivera', acquisitionSource: 'Web', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-09-12T00:00:00.000Z' }]} onSelect={vi.fn()} providers={[]} tasks={[]} trips={[]} /><button type="button">Otro campo</button></>);

    await user.type(screen.getByRole('searchbox'), 'rivera');
    expect(screen.getByText('Familia Rivera')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Otro campo' }));

    expect(screen.queryByText('Familia Rivera')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Otro campo' }));
  });
});
