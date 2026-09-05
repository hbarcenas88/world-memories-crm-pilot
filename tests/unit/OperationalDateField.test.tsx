import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperationalDateField } from "../../src/design/components/OperationalDateField";
import { LocaleProvider } from "../../src/app/i18n";

describe("OperationalDateField", () => {
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
});
