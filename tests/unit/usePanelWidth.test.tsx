import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePanelWidth } from '../../src/design/hooks/usePanelWidth';

function PanelWidthProbe() {
  const { reset, setWidth, width } = usePanelWidth();
  return <>
    <output>{width}</output>
    <button onClick={() => setWidth(600)} type="button">Ampliar</button>
    <button onClick={reset} type="button">Restablecer</button>
  </>;
}

describe('usePanelWidth', () => {
  beforeEach(() => localStorage.clear());

  it('clamps and remembers the panel width, then restores its default', () => {
    render(<PanelWidthProbe />);

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar' }));
    expect(screen.getByRole('status').textContent).toBe('560');
    expect(localStorage.getItem('wm.detailPanelWidth')).toBe('560');

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(screen.getByRole('status').textContent).toBe('420');
    expect(localStorage.getItem('wm.detailPanelWidth')).toBeNull();
  });
});
