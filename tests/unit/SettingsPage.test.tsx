import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../src/app/i18n";
import { createDefaultWorkspaceConfiguration } from "../../src/domain/workspaceConfiguration";
import { SettingsPage } from "../../src/features/settings/SettingsPage";

describe("SettingsPage", () => {
  it("adds and deactivates a global catalog entry without changing the fixed operational formats", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(
      <LocaleProvider locale="es">
        <SettingsPage
          configuration={createDefaultWorkspaceConfiguration(
            "2026-09-01T00:00:00.000Z",
          )}
          onSave={save}
        />
      </LocaleProvider>,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }),
      "Expedición",
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar tipo de viaje" }),
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Activo: Expedición",
    });
    await user.click(checkbox);
    await user.click(
      screen.getByRole("button", { name: "Guardar configuración" }),
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: "DD/MM/YYYY",
        catalogs: expect.objectContaining({
          travelTypes: expect.arrayContaining([
            expect.objectContaining({ label: "Expedición", active: false }),
          ]),
        }),
      }),
    );
  });
});
