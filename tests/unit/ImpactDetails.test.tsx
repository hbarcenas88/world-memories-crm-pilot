import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ImpactDetails } from '../../src/features/records/ImpactDetails';

afterEach(cleanup);

describe('ImpactDetails', () => {
  it('presents a known activity in the active interface language without showing its stored code or payload', () => {
    render(<LocaleProvider locale="en"><ImpactDetails dependencies={[{
      label: 'Evento de actividad',
      count: 1,
      items: [{ id: 'event-1', label: 'client_workspace_saved · {"private":"hidden"}', eventType: 'client_workspace_saved', occurredAt: '2026-08-04T15:30:00.000Z' }],
    }]} /></LocaleProvider>);

    expect(screen.getByText(/Client workspace updated · 04\/08\/2026 \d{2}:\d{2}/)).toBeTruthy();
    expect(screen.queryByText(/client_workspace_saved/)).toBeNull();
    expect(screen.queryByText(/hidden/)).toBeNull();
  });

  it('reveals every related record through explicit local pagination instead of silently truncating the impact', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const items = Array.from({ length: 11 }, (_, index) => ({ id: `task-${index + 1}`, label: `Tarea relacionada ${index + 1}` }));
    render(<ImpactDetails dependencies={[{ label: 'Tarea', count: items.length, items }]} />);

    expect(screen.getByText('Tarea relacionada 10')).toBeTruthy();
    expect(screen.queryByText('Tarea relacionada 11')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mostrar 1 más' }));
    expect(screen.getByText('Tarea relacionada 11')).toBeTruthy();
  });
});
