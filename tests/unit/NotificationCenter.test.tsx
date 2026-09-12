import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { NotificationCenter } from '../../src/features/notifications/NotificationCenter';

afterEach(cleanup);

describe('NotificationCenter', () => {
  it('reveals active alerts without dismissing them and opens their context', async () => {
    const user = userEvent.setup();
    const notification = { id: 'task:task-1', kind: 'task' as const, targetId: 'task-1', subject: 'Confirmar itinerario' };
    const onOpen = vi.fn();
    render(<NotificationCenter notifications={[notification]} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones (1)' }));
    expect(screen.getByRole('heading', { name: 'Alertas activas' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Tarea vencida: Confirmar itinerario' }));

    expect(onOpen).toHaveBeenCalledWith(notification);
    expect(screen.getByText('Tarea vencida: Confirmar itinerario')).toBeTruthy();
  });

  it('renders the alert template in English while preserving the entered task title', async () => {
    const user = userEvent.setup();
    const notification = { id: 'task:task-1', kind: 'task' as const, targetId: 'task-1', subject: 'Confirmar itinerario' };
    render(<LocaleProvider locale="en"><NotificationCenter notifications={[notification]} onOpen={vi.fn()} /></LocaleProvider>);

    await user.click(screen.getByRole('button', { name: 'Notifications (1)' }));
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Active alerts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Overdue task: Confirmar itinerario' })).toBeTruthy();
  });

  it('closes the notification panel when the operator clicks outside it', async () => {
    const user = userEvent.setup();
    render(<><NotificationCenter notifications={[]} onOpen={vi.fn()} /><button type="button">Otro campo</button></>);

    await user.click(screen.getByRole('button', { name: 'Notificaciones (0)' }));
    expect(screen.getByRole('region', { name: 'Notificaciones' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Otro campo' }));

    expect(screen.queryByRole('region', { name: 'Notificaciones' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Otro campo' }));
  });
});
