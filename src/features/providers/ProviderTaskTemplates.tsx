import { useState } from "react";
import { t, useLocale } from "../../app/i18n";
import type { ProviderTaskTemplate } from "../../domain/types";

export type ProviderTaskTemplateValue = Readonly<
  Pick<ProviderTaskTemplate, "title" | "required" | "relativeTo" | "active"> & {
    id?: string;
    offsetDays?: number;
    offsetMonths?: number;
  }
>;

export function ProviderTaskTemplates({
  templates,
  onSave,
}: Readonly<{
  templates: readonly ProviderTaskTemplate[];
  onSave: (value: ProviderTaskTemplateValue) => Promise<void>;
}>) {
  const locale = useLocale();
  const [title, setTitle] = useState("");
  const [required, setRequired] = useState(false);
  const [relativeTo, setRelativeTo] =
    useState<ProviderTaskTemplate["relativeTo"]>("manual");
  const [offsetDays, setOffsetDays] = useState("");
  const [offsetUnit, setOffsetUnit] = useState<"days" | "months">("days");
  const [editingId, setEditingId] = useState<string>();
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string>();
  const label = (key: import("../../app/i18n").TranslationKey) =>
    t(key, locale);
  async function save(activeOverride = active): Promise<void> {
    const offset = offsetDays.trim() === "" ? undefined : Number(offsetDays);
    if (
      title.trim() === "" ||
      (offset !== undefined && !Number.isInteger(offset))
    ) {
      setError(
        title.trim() === ""
          ? label("templateTitleRequired")
          : label("relativeDaysInvalid"),
      );
      return;
    }
    setError(undefined);
    await onSave({
      ...(editingId ? { id: editingId } : {}),
      title: title.trim(),
      required,
      relativeTo,
      ...(offset === undefined
        ? {}
        : offsetUnit === "days"
          ? { offsetDays: offset }
          : { offsetMonths: offset }),
      active: activeOverride,
    });
    setTitle("");
    setRequired(false);
    setRelativeTo("manual");
    setOffsetDays("");
    setOffsetUnit("days");
    setEditingId(undefined);
    setActive(true);
  }
  function edit(template: ProviderTaskTemplate): void {
    setEditingId(template.id);
    setTitle(template.title);
    setRequired(template.required);
    setRelativeTo(template.relativeTo);
    setOffsetDays(
      template.offsetDays === undefined && template.offsetMonths === undefined
        ? ""
        : String(template.offsetDays ?? template.offsetMonths),
    );
    setOffsetUnit(template.offsetMonths === undefined ? "days" : "months");
    setActive(template.active);
    setError(undefined);
  }
  return (
    <section aria-label={label("providerTaskTemplates")}>
      <p className="muted-copy">{label("taskTemplatesDescription")}</p>
      <ul className="task-list">
        {templates.map((template) => (
          <li key={template.id}>
            <span>
              {template.title}
              {template.required ? ` · ${label("required")}` : ""}
            </span>
            <small>
              {template.active
                ? label("templateActive")
                : label("templateInactive")}
            </small>
            <button
              aria-label={t("editTemplate", locale, { title: template.title })}
              className="text-button"
              onClick={() => edit(template)}
              type="button"
            >
              {label("edit")}
            </button>
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <label>
          {label("templateTitle")}
          <input
            aria-label={label("templateTitle")}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label>
          {label("dateReference")}
          <select
            aria-label={label("dateReference")}
            onChange={(event) =>
              setRelativeTo(
                event.target.value as ProviderTaskTemplate["relativeTo"],
              )
            }
            value={relativeTo}
          >
            <option value="manual">{label("manual")}</option>
            <option value="trip_start">{label("tripStart")}</option>
            <option value="trip_end">{label("tripEnd")}</option>
          </select>
        </label>
        <label>
          {label("offsetUnit")}
          <select
            aria-label={label("offsetUnit")}
            onChange={(event) => setOffsetUnit(event.target.value as "days" | "months")}
            value={offsetUnit}
          >
            <option value="days">{label("days")}</option>
            <option value="months">{label("months")}</option>
          </select>
        </label>
        <label>
          {label(offsetUnit === "days" ? "relativeDays" : "relativeMonths")}
          <input
            aria-label={label(offsetUnit === "days" ? "relativeDays" : "relativeMonths")}
            onChange={(event) => setOffsetDays(event.target.value)}
            type="number"
            value={offsetDays}
          />
        </label>
      </div>
      <label>
        <input
          aria-label={label("required")}
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
          type="checkbox"
        />
        {label("required")}
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="secondary-button"
        onClick={() => {
          void save();
        }}
        type="button"
      >
        {label("saveTemplate")}
      </button>
      {editingId && (
        <button
          className="text-button"
          onClick={() => {
            void save(!active);
          }}
          type="button"
        >
          {active ? label("deactivateTemplate") : label("activateTemplate")}
        </button>
      )}
    </section>
  );
}
