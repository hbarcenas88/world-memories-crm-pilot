import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { ResizableDetailPanel } from '../../src/design/components/ResizableDetailPanel';

describe('ResizableDetailPanel', () => {
  beforeEach(() => localStorage.clear());

  it('changes and restores the panel width with the keyboard-accessible separator', () => {
    render(<ResizableDetailPanel panel={<aside>Detalle</aside>}><section>Lista</section></ResizableDetailPanel>);
    const separator = screen.getByRole('separator', { name: 'Ajustar ancho del panel de detalle' });

    expect(separator.getAttribute('aria-valuenow')).toBe('420');
    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(separator.getAttribute('aria-valuenow')).toBe('440');
    expect(localStorage.getItem('wm.detailPanelWidth')).toBe('440');

    fireEvent.keyDown(separator, { key: 'End' });
    expect(separator.getAttribute('aria-valuenow')).toBe('560');
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer ancho del panel' }));
    expect(separator.getAttribute('aria-valuenow')).toBe('420');
    expect(localStorage.getItem('wm.detailPanelWidth')).toBeNull();
  });

  it('translates the resizable panel controls to English', () => {
    render(<LocaleProvider locale="en"><ResizableDetailPanel panel={<aside>Detail</aside>}><section>List</section></ResizableDetailPanel></LocaleProvider>);

    expect(screen.getByRole('separator', { name: 'Adjust detail panel width' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset panel width' })).toBeTruthy();
  });
});
