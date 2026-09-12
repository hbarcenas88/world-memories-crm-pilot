import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OperationalTimeField } from '../../src/design/components/OperationalTimeField';

describe('OperationalTimeField', () => {
  it('stores a valid operational time as HH:mm and rejects impossible times', () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<OperationalTimeField aria-label="Hora de prueba" onChange={onChange} onValidityChange={onValidityChange} />);

    const field = screen.getByRole('textbox', { name: 'Hora de prueba' });
    fireEvent.change(field, { target: { value: '1430' } });
    expect((field as HTMLInputElement).value).toBe('14:30');
    expect(onChange).toHaveBeenLastCalledWith('14:30');

    fireEvent.change(field, { target: { value: '24:00' } });
    fireEvent.blur(field);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
