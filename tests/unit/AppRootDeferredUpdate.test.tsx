import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { MemoryWorkspaceRepository } from '../../src/test/memoryRepository';

describe('deferred PWA updates', () => {
  afterEach(() => {
    cleanup();
  });

  it('defers an available update without discarding it and offers it again at the next check', async () => {
    const user = userEvent.setup();
    render(<App applyUpdate={async () => undefined} repository={new MemoryWorkspaceRepository()} updatePromptReofferMs={500} />);

    await user.click(screen.getByRole('button', { name: 'Más tarde' }));
    expect(screen.queryByRole('button', { name: 'Actualizar ahora' })).toBeNull();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actualizar ahora' })).toBeTruthy();
    });
  });
});
