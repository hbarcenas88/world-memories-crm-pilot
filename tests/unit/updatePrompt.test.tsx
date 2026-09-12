import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { createUpdateController } from '../../src/infrastructure/pwa/updatePrompt';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('createUpdateController', () => {
  afterEach(cleanup);

  it('defers an available update without refreshing until the operator confirms it', async () => {
    let applied = 0;
    const controller = createUpdateController(async () => { applied += 1; });
    controller.available();
    expect(controller.state()).toBe('available');
    controller.defer();
    expect(controller.state()).toBe('deferred');
    expect(applied).toBe(0);
    await controller.requestUpdate();
    expect(applied).toBe(1);
  });

  it('does not apply a pending update from the interface until the operator confirms it', async () => {
    const user = userEvent.setup();
    let applied = 0;
    let deferred = 0;
    render(<App applyUpdate={async () => { applied += 1; }} onDeferUpdate={() => { deferred += 1; }} repository={new MemoryWorkspaceRepository()} updatePromptReofferMs={0} />);

    await user.click(screen.getByRole('button', { name: 'Más tarde' }));
    expect(deferred).toBe(1);
    expect(applied).toBe(0);

    await screen.findByRole('button', { name: 'Actualizar ahora' });
    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }));
    expect(applied).toBe(1);
  });

  it('blocks a schema-changing update until a current JSON backup exists', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<App applyUpdate={async () => undefined} onDeferUpdate={() => undefined} repository={repository} requiresBackupForUpdate />);

    expect((screen.getByRole('button', { name: 'Actualizar ahora' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Descarga primero un respaldo JSON actual antes de aplicar esta actualización.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ir a respaldo' })).toBeTruthy();
  });

  it('keeps the update available and explains when applying it fails', async () => {
    const user = userEvent.setup();
    render(<App applyUpdate={async () => { throw new Error('offline'); }} repository={new MemoryWorkspaceRepository()} />);

    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }));

    expect(screen.getByText('No fue posible aplicar la actualización. Inténtalo de nuevo.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Actualizar ahora' })).toBeTruthy();
  });

  it('does not apply an update while a Settings draft is waiting for an explicit decision', async () => {
    const user = userEvent.setup();
    let applied = 0;
    render(<App applyUpdate={async () => { applied += 1; }} repository={new MemoryWorkspaceRepository()} />);

    await user.click(screen.getByRole('button', { name: 'Configuración' }));
    await user.click(screen.getByRole('button', { name: 'Abrir Tipos de viaje' }));
    await user.type(screen.getByRole('textbox', { name: 'Nuevo tipo de viaje' }), 'Expedición de actualización');
    await user.click(screen.getByRole('button', { name: 'Agregar tipo de viaje' }));

    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }));

    expect(applied).toBe(0);
    expect(screen.getByRole('dialog', { name: '¿Descartar cambios?' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(applied).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }));
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    await waitFor(() => expect(applied).toBe(1));
  });

  it('translates the update prompt and shared navigation when English is selected', async () => {
    const user = userEvent.setup();
    render(<App applyUpdate={async () => undefined} onDeferUpdate={() => undefined} repository={new MemoryWorkspaceRepository()} />);
    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
    expect(screen.getByText('An update is ready. Your current work will not reload until you confirm it.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Later' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Update now' })).toBeTruthy();
  });
});
