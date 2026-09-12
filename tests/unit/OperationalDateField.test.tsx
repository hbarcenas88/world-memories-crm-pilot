import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperationalDateField } from "../../src/design/components/OperationalDateField";
import { LocaleProvider } from "../../src/app/i18n";

describe("OperationalDateField", () => {
  afterEach(cleanup);
  it("shows and captures a fixed DD/MM/YYYY date without exposing a native date control", () => {
    const onChange = vi.fn();
    render(
      <OperationalDateField
        aria-label="Fecha de prueba"
        onChange={onChange}
        value="2026-08-31"
      />,
    );
    const field = screen.getByRole("textbox", { name: "Fecha de prueba" });
    expect((field as HTMLInputElement).value).toBe("31/08/2026");
    fireEvent.change(field, { target: { value: "01/09/2026" } });
    fireEvent.blur(field);
    expect(onChange).toHaveBeenCalledWith("2026-09-01");
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  it("uses English calendar controls when the interface is in English without changing the date format", () => {
    render(
      <LocaleProvider locale="en">
        <OperationalDateField
          aria-label="Test date"
          onChange={vi.fn()}
          value="2026-08-31"
        />
      </LocaleProvider>,
    );
    expect(
      (screen.getByRole("textbox", { name: "Test date" }) as HTMLInputElement)
        .value,
    ).toBe("31/08/2026");
    expect(
      screen.getByRole("button", { name: "Open calendar: Test date" }),
    ).toBeTruthy();
  });

  it("keeps an invalid visible draft from being saved as the previous date", () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<OperationalDateField aria-label="Fecha de prueba" onChange={onChange} onValidityChange={onValidityChange} value="2026-08-31" />);

    const field = screen.getByRole("textbox", { name: "Fecha de prueba" });
    fireEvent.change(field, { target: { value: "31/02/2026" } });
    fireEvent.blur(field);

    expect((field as HTMLInputElement).value).toBe("31/02/2026");
    expect(onChange).not.toHaveBeenCalled();
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
  });

  it('supports keyboard day navigation and returns focus to its trigger on Escape', async () => {
    const onChange = vi.fn();
    render(<OperationalDateField aria-label="Fecha de prueba" onChange={onChange} value="2026-08-31" />);

    const trigger = screen.getByRole('button', { name: 'Abrir calendario: Fecha de prueba' });
    fireEvent.click(trigger);
    const selected = screen.getByRole('gridcell', { name: '31/08/2026' });
    fireEvent.keyDown(selected, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement?.getAttribute('data-operational-date')).toBe('2026-09-01'));
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('2026-09-01');

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('gridcell', { name: '01/09/2026' }), { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('dismisses its calendar when the operator clicks another field', async () => {
    const user = userEvent.setup();
    render(<><OperationalDateField aria-label="Fecha de prueba" onChange={vi.fn()} /><button type="button">Otro campo</button></>);

    await user.click(screen.getByRole('button', { name: 'Abrir calendario: Fecha de prueba' }));
    expect(screen.getByRole('dialog', { name: 'Calendario: Fecha de prueba' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Otro campo' }));

    expect(screen.queryByRole('dialog', { name: 'Calendario: Fecha de prueba' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Otro campo' }));
  });
});
