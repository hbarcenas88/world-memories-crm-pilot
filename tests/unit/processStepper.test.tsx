import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProcessStepper } from '../../src/design/components/ProcessStepper';

describe('ProcessStepper', () => {
  it('announces only the current non-navigable step', () => {
    render(<ProcessStepper currentId="payment" steps={[{ id: 'client', label: 'Cliente' }, { id: 'payment', label: 'Pago' }, { id: 'review', label: 'Revisar' }]} />);
    expect(screen.getByRole('list', { name: 'Progreso del proceso' })).toBeTruthy();
    expect(screen.getByText('Pago').closest('li')?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('Cliente').closest('li')?.getAttribute('aria-current')).toBeNull();
  });
});
