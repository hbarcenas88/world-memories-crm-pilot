import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { AmountField } from '../../src/design/components/AmountField';

describe('AmountField', () => {
  afterEach(cleanup);

  it('groups a typed amount, preserves the numeric value, and completes cents on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountField errorMessage="Importe inválido" label="Presupuesto" onChange={onChange} value={undefined} />);

    const input = screen.getByLabelText('Presupuesto');
    await user.type(input, '1234.5');
    expect((input as HTMLInputElement).value).toBe('1,234.5');
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
    await user.tab();
    expect((input as HTMLInputElement).value).toBe('1,234.50');
  });

  it('does not turn an ambiguous pasted amount into a different number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AmountField errorMessage="Importe inválido" label="Presupuesto" onChange={onChange} value={undefined} />);

    await user.click(screen.getByLabelText('Presupuesto'));
    await user.paste('1,2,3');
    expect(screen.getByLabelText('Presupuesto').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Importe inválido')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears its visible text when its owner resets the numeric value after saving', async () => {
    const user = userEvent.setup();
    function ControlledAmount() {
      const [value, setValue] = useState<number | undefined>(1234.5);
      return <><AmountField errorMessage="Importe inválido" label="Pago" onChange={setValue} value={value} /><button onClick={() => setValue(undefined)} type="button">Restablecer</button></>;
    }
    render(<ControlledAmount />);

    expect((screen.getByLabelText('Pago') as HTMLInputElement).value).toBe('1,234.5');
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));

    expect((screen.getByLabelText('Pago') as HTMLInputElement).value).toBe('');
  });
});
