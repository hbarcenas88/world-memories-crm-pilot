import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadList } from "../../src/features/leads/LeadList";

describe("LeadList", () => {
  afterEach(cleanup);
  it("renders translated status labels instead of internal state identifiers", () => {
    render(
      <LeadList
        leads={[]}
        locale="es"
        showForm={false}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("option", { name: "Consulta recibida" }),
    ).toBeTruthy();
    expect(screen.queryByRole("option", { name: "new" })).toBeNull();
  });
  it("passes the selected Lead values to the edit form", () => {
    render(
      <LeadList
        editingLead={{
          id: "lead-1",
          name: "Ana Rivera",
          acquisitionSource: "Referido",
          referredBy: "Luis",
          residenceCountry: "Panamá",
          phone: "6000-0000",
          email: "ana@example.com",
          destination: "Orlando",
          travelType: "Paquete Disney",
          requestedDateStatus: "dates_known",
          budget: { amount: 2800, currency: "USD" },
          status: "follow_up",
          createdAt: "2026-08-29T00:00:00.000Z",
        }}
        leads={[]}
        locale="es"
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSelect={vi.fn()}
        showForm
      />,
    );

    expect(
      screen.getByLabelText("Nombre o referencia").getAttribute("value"),
    ).toBe("Ana Rivera");
    expect(screen.getByLabelText("Presupuesto").getAttribute("value")).toBe(
      "2800",
    );
  });

  it("keeps archived Leads visible through an explicit archive filter", async () => {
    const user = userEvent.setup();
    render(
      <LeadList
        leads={[
          {
            id: "active",
            name: "Consulta activa",
            acquisitionSource: "Web",
            requestedDateStatus: "dates_to_define",
            status: "contacted",
            createdAt: "2026-08-29T00:00:00.000Z",
          },
          {
            id: "archived",
            name: "Consulta archivada",
            acquisitionSource: "Referido",
            requestedDateStatus: "dates_to_define",
            status: "paused",
            createdAt: "2026-08-29T00:00:00.000Z",
            archivedAt: "2026-08-29T01:00:00.000Z",
          },
        ]}
        locale="es"
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSelect={vi.fn()}
        showForm={false}
      />,
    );

    expect(screen.getByText("Consulta activa")).toBeTruthy();
    expect(screen.queryByText("Consulta archivada")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Archivados" }));
    expect(screen.getByText("Consulta archivada")).toBeTruthy();
    expect(screen.getByText("Archivado")).toBeTruthy();
  });

  it("renders Lead status labels instead of persisted status identifiers", () => {
    render(
      <LeadList
        leads={[
          {
            id: "sold",
            name: "Consulta vendida",
            acquisitionSource: "Web",
            requestedDateStatus: "dates_to_define",
            status: "sold",
            createdAt: "2026-08-29T00:00:00.000Z",
          },
        ]}
        locale="es"
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onSelect={vi.fn()}
        showForm={false}
      />,
    );

    const row = screen.getByRole("button", { name: /Consulta vendida/ });
    expect(within(row).getByText("Lead convertido")).toBeTruthy();
    expect(within(row).queryByText("sold")).toBeNull();
  });
});
