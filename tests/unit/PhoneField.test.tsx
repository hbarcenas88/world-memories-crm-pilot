import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { PhoneField } from '../../src/design/components/PhoneField';

describe('PhoneField', () => {
  afterEach(cleanup);

  it('uses a country prefix chosen independently from residence and serializes the entered national number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleProvider locale="es"><PhoneField countryLabel="Código internacional" label="Teléfono" onChange={onChange} value="6000-0000" /></LocaleProvider>);

    const picker = screen.getByRole('combobox', { name: 'Código internacional' });
    await user.click(picker);
    await user.clear(picker);
    await user.type(picker, 'Mexico');
    expect(screen.getByRole('option', { name: /^México \(MX\), \+52$/u })).toBeTruthy();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('+5260000000');
  });

  it('does not duplicate an explicit international prefix pasted by the operator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleProvider locale="es"><PhoneField countryLabel="Código internacional" label="Teléfono" onChange={onChange} value="+507 6000-0000" /></LocaleProvider>);

    const picker = screen.getByRole('combobox', { name: 'Código internacional' });
    await user.click(picker);
    await user.clear(picker);
    await user.type(picker, 'Mexico');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('+50760000000');
  });

  it('does not rewrite a shared +1 prefix when the operator selects a different country that uses it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleProvider locale="es"><PhoneField countryLabel="Código internacional" label="Teléfono" onChange={onChange} value="+1 416 555 0100" /></LocaleProvider>);

    const picker = screen.getByRole('combobox', { name: 'Código internacional' });
    await user.click(picker);
    await user.clear(picker);
    await user.type(picker, 'Estados Unidos');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenLastCalledWith('+14165550100');
  });
});
