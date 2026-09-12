import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider } from "../../src/app/i18n";
import { createDefaultWorkspaceConfiguration } from "../../src/domain/workspaceConfiguration";
import { SettingsPage } from "../../src/features/settings/SettingsPage";

describe("SettingsPage", () => {
  afterEach(cleanup);
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

    expect(screen.queryByRole("textbox", { name: "Nuevo tipo de viaje" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.type(
      screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }),
      "Expedición",
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar tipo de viaje" }),
    );
    const toggle = screen.getByRole("switch", {
      name: "Disponible para nuevas selecciones: Expedición",
    });
    await user.click(toggle);
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

  it("asks before discarding unsaved catalog changes", async () => {
    const user = userEvent.setup();
    render(<SettingsPage configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")} onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.type(screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }), "Expedición");
    await user.click(screen.getByRole("button", { name: "Agregar tipo de viaje" }));
    await user.click(screen.getByRole("button", { name: "Cancelar cambios" }));

    expect(screen.getByRole("dialog", { name: "¿Descartar cambios?" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    await user.click(screen.getByRole("button", { name: "Editar: Expedición" }));
    expect(screen.getByRole("textbox", { name: "Editar: Expedición" })).toBeTruthy();
  });

  it("holds shell navigation until the user keeps, discards, or saves the settings draft", async () => {
    const user = userEvent.setup();
    let requestNavigation: ((proceed: () => void) => void) | undefined;
    const proceed = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <SettingsPage
        configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")}
        onNavigationGuardChange={(nextGuard) => { requestNavigation = nextGuard; }}
        onSave={save}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.type(screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }), "Expedición");
    await user.click(screen.getByRole("button", { name: "Agregar tipo de viaje" }));
    await waitFor(() => expect(requestNavigation).toBeDefined());
    await act(async () => { requestNavigation?.(proceed); });

    expect(screen.getByRole("dialog", { name: "¿Descartar cambios?" })).toBeTruthy();
    expect(proceed).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(proceed).not.toHaveBeenCalled();

    await act(async () => { requestNavigation?.(proceed); });
    await user.click(within(screen.getByRole("dialog", { name: "¿Descartar cambios?" })).getByRole("button", { name: "Guardar configuración" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(proceed).toHaveBeenCalledTimes(1);

    await user.type(screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }), "Otra expedición");
    await user.click(screen.getByRole("button", { name: "Agregar tipo de viaje" }));
    await waitFor(() => expect(requestNavigation).toBeDefined());
    await act(async () => { requestNavigation?.(proceed); });
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(proceed).toHaveBeenCalledTimes(2);
  });

  it("opens one catalog card at a time and keeps its unsaved draft when returning", async () => {
    const user = userEvent.setup();
    render(<SettingsPage configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")} onSave={vi.fn()} />);

    expect(screen.queryByRole("textbox", { name: "Nuevo tipo de viaje" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.type(screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }), "Expedición");
    await user.click(screen.getByRole("button", { name: "Agregar tipo de viaje" }));
    await user.click(screen.getByRole("button", { name: "Volver a Configuración" }));

    expect(screen.queryByRole("textbox", { name: "Editar: Expedición" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.click(screen.getByRole("button", { name: "Editar: Expedición" }));
    expect(screen.getByRole("textbox", { name: "Editar: Expedición" })).toBeTruthy();
  });

  it('requires an explicit edit action before changing an existing catalog label', async () => {
    const user = userEvent.setup();
    const configuration = createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z");
    const original = configuration.catalogs.travelTypes[0];
    const save = vi.fn();
    render(<SettingsPage configuration={configuration} onSave={save} />);

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    expect(screen.queryByRole('textbox', { name: `Editar: ${original.label}` })).toBeNull();
    await user.click(screen.getByRole('button', { name: `Editar: ${original.label}` }));
    const edit = screen.getByRole('textbox', { name: `Editar: ${original.label}` });
    await user.clear(edit);
    await user.type(edit, 'Viaje de prueba');
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      catalogs: expect.objectContaining({
        travelTypes: expect.arrayContaining([
          expect.objectContaining({ id: original.id, label: 'Viaje de prueba' }),
        ]),
      }),
    }));
  });

  it('does not save a catalog rename that duplicates another label', async () => {
    const user = userEvent.setup();
    const configuration = createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z");
    const [first, second] = configuration.catalogs.travelTypes;
    const save = vi.fn();
    render(<SettingsPage configuration={configuration} onSave={save} />);

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.click(screen.getByRole('button', { name: `Editar: ${first.label}` }));
    const edit = screen.getByRole('textbox', { name: `Editar: ${first.label}` });
    await user.clear(edit);
    await user.type(edit, second.label);
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(screen.getByRole('alert').textContent).toBe('Ya existe una entrada con este nombre.');
    expect(save).not.toHaveBeenCalled();
  });

  it('does not save a catalog rename with an empty label', async () => {
    const user = userEvent.setup();
    const configuration = createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z");
    const first = configuration.catalogs.travelTypes[0];
    const save = vi.fn();
    render(<SettingsPage configuration={configuration} onSave={save} />);

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.click(screen.getByRole('button', { name: `Editar: ${first.label}` }));
    await user.clear(screen.getByRole('textbox', { name: `Editar: ${first.label}` }));
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(screen.getByRole('alert').textContent).toBe('Indica un nombre válido para la entrada.');
    expect(save).not.toHaveBeenCalled();
  });

  it("presents each global catalog as a descriptive card with an explicit open action", () => {
    render(<SettingsPage configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")} onSave={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Abrir Tipos de viaje" })).toBeTruthy();
    expect(screen.getByText("Define las opciones disponibles al crear o editar un viaje.")).toBeTruthy();
  });

  it("keeps language and fixed operational formats inside their own settings card", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(<SettingsPage configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")} onSave={save} />);

    await user.click(screen.getByRole("button", { name: "Abrir Preferencias y formatos" }));
    expect(screen.getByText("Fecha: DD/MM/YYYY")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Idioma"), "en");
    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ locale: "en" }));
  });

  it("keeps the catalog draft available and reports a failed save", async () => {
    const user = userEvent.setup();
    render(<SettingsPage configuration={createDefaultWorkspaceConfiguration("2026-09-01T00:00:00.000Z")} onSave={vi.fn().mockRejectedValue(new Error('synthetic storage failure'))} />);

    await user.click(screen.getByRole("button", { name: /Tipos de viaje/ }));
    await user.type(screen.getByRole("textbox", { name: "Nuevo tipo de viaje" }), "Expedición");
    await user.click(screen.getByRole("button", { name: "Agregar tipo de viaje" }));
    await user.click(screen.getByRole("button", { name: "Guardar configuración" }));

    expect((await screen.findByRole('alert')).textContent).toBe('No fue posible guardar la configuración. Revisa los cambios e inténtalo nuevamente.');
    await user.click(screen.getByRole("button", { name: "Editar: Expedición" }));
    expect((screen.getByRole("textbox", { name: "Editar: Expedición" }) as HTMLInputElement).value).toBe('Expedición');
  });

  it('hydrates a replacement persisted configuration without marking an untouched editor as dirty', async () => {
    let navigationGuard: ((proceed: () => void) => void) | undefined;
    const initial = createDefaultWorkspaceConfiguration('2026-09-01T00:00:00.000Z');
    const persisted = createDefaultWorkspaceConfiguration('2026-09-02T00:00:00.000Z');
    const view = render(<SettingsPage configuration={initial} onNavigationGuardChange={(guard) => { navigationGuard = guard; }} onSave={vi.fn()} />);

    view.rerender(<SettingsPage configuration={persisted} onNavigationGuardChange={(guard) => { navigationGuard = guard; }} onSave={vi.fn()} />);

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancelar cambios' })).toBeNull());
    expect(navigationGuard).toBeUndefined();
  });
});
