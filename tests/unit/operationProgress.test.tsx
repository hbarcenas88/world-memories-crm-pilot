import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OperationProgress } from '../../src/design/components/OperationProgress';

describe('OperationProgress', () => {
  afterEach(cleanup);

  it('uses a measurable progress bar only when the operation provides real counts', () => {
    render(<OperationProgress completed={2} label="Validando filas" total={5} />);

    expect(screen.getByRole('progressbar').getAttribute('value')).toBe('2');
    expect(screen.getAllByText('2 de 5')).toHaveLength(2);
  });

  it('announces an indeterminate real stage without inventing a percentage', () => {
    render(<OperationProgress label="Restaurando respaldo" />);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Restaurando respaldo');
  });
});
