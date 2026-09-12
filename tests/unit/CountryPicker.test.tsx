import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { CountryPicker } from '../../src/design/components/CountryPicker';

describe('CountryPicker', () => {
  afterEach(cleanup);

  it('filters by an unaccented country name and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleProvider locale="es"><CountryPicker label="País de residencia" onChange={onChange} value="" /></LocaleProvider>);

    const picker = screen.getByRole('combobox', { name: 'País de residencia' });
    await user.click(picker);
    await user.type(picker, 'mexico');
    expect(screen.getByRole('option', { name: /^México$/u })).toBeTruthy();

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('MX');
  });

  it('closes its residence results when the operator clicks outside the picker', async () => {
    const user = userEvent.setup();
    render(<LocaleProvider locale="es"><><CountryPicker label="País de residencia" onChange={vi.fn()} value="" /><button type="button">Otro campo</button></></LocaleProvider>);

    await user.click(screen.getByRole('combobox', { name: 'País de residencia' }));
    expect(screen.getByRole('listbox', { name: 'País de residencia' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Otro campo' }));

    expect(screen.queryByRole('listbox', { name: 'País de residencia' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Otro campo' }));
  });

  it('keeps an unknown historical value readable and never silently maps it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocaleProvider locale="en"><CountryPicker label="Residence country" onChange={onChange} value="Atlantis histórica" /></LocaleProvider>);

    const picker = screen.getByRole('combobox', { name: 'Residence country' });
    expect((picker as HTMLInputElement).value).toBe('Atlantis histórica');
    await user.click(picker);
    await user.clear(picker);
    await user.type(picker, 'does-not-exist');
    expect(screen.getByText('No results')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect((picker as HTMLInputElement).value).toBe('Atlantis histórica');
    expect(onChange).not.toHaveBeenCalled();
  });
});
