import { useState } from "react";
import { useLocale } from "../../app/i18n";
import type {
  CatalogEntry,
  GlobalCatalogKey,
  WorkspaceConfiguration,
} from "../../domain/types";

type SettingsPageProps = Readonly<{
  configuration: WorkspaceConfiguration;
  onSave: (configuration: WorkspaceConfiguration) => void | Promise<void>;
}>;

const catalogKeys: readonly GlobalCatalogKey[] = [
  "travelTypes",
  "acquisitionSources",
  "communicationChannels",
  "cancellationReasons",
  "familyRelationships",
];
const singularCatalogNames: Readonly<
  Record<"es" | "en", Record<GlobalCatalogKey, string>>
> = {
  es: {
    travelTypes: "tipo de viaje",
    acquisitionSources: "fuente de adquisición",
    communicationChannels: "canal de comunicación",
    cancellationReasons: "motivo de cancelación",
    familyRelationships: "relación familiar",
  },
  en: {
    travelTypes: "travel type",
    acquisitionSources: "acquisition source",
    communicationChannels: "communication channel",
    cancellationReasons: "cancellation reason",
    familyRelationships: "family relationship",
  },
};
const copy = {
  es: {
    title: "Configuración global",
    description:
      "Estos catálogos se comparten en el CRM. Desactivar un valor conserva los registros históricos que ya lo usan.",
    save: "Guardar configuración",
    formats: "Formatos operativos",
    date: "Fecha: DD/MM/YYYY",
    time: "Hora: 24 horas",
    number: "Números: 1,234.56",
    travelTypes: "Tipos de viaje",
    acquisitionSources: "Fuentes de adquisición",
    communicationChannels: "Canales de comunicación",
    cancellationReasons: "Motivos de cancelación",
    familyRelationships: "Relaciones familiares",
    new: {
      travelTypes: "Nuevo tipo de viaje",
      acquisitionSources: "Nueva fuente de adquisición",
      communicationChannels: "Nuevo canal de comunicación",
      cancellationReasons: "Nuevo motivo de cancelación",
      familyRelationships: "Nueva relación familiar",
    },
    add: "Agregar",
    active: "Activo",
    duplicate: "Ya existe una entrada con este nombre.",
    empty: "Aún no hay valores. Puedes crear el primero.",
  },
  en: {
    title: "Global settings",
    description:
      "These catalogs are shared across the CRM. Deactivating a value preserves historic records that already use it.",
    save: "Save settings",
    formats: "Operational formats",
    date: "Date: DD/MM/YYYY",
    time: "Time: 24-hour",
    number: "Numbers: 1,234.56",
    travelTypes: "Travel types",
    acquisitionSources: "Acquisition sources",
    communicationChannels: "Communication channels",
    cancellationReasons: "Cancellation reasons",
    familyRelationships: "Family relationships",
    new: {
      travelTypes: "New travel type",
      acquisitionSources: "New acquisition source",
      communicationChannels: "New communication channel",
      cancellationReasons: "New cancellation reason",
      familyRelationships: "New family relationship",
    },
    add: "Add",
    active: "Active",
    duplicate: "An entry with this name already exists.",
    empty: "There are no values yet. You can create the first one.",
  },
} as const;

function idFor(catalog: GlobalCatalogKey, label: string): string {
  return `${catalog}-${label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

function SettingsPageState({ configuration, onSave }: SettingsPageProps) {
  const locale = useLocale();
  const labels = copy[locale];
  const [draft, setDraft] = useState(configuration);
  const [newLabels, setNewLabels] = useState<
    Partial<Record<GlobalCatalogKey, string>>
  >({});
  const [error, setError] = useState<string | undefined>();
  const catalogName = (catalog: GlobalCatalogKey) => labels[catalog];
  const add = (catalog: GlobalCatalogKey) => {
    const label = newLabels[catalog]?.trim() ?? "";
    if (!label) return;
    if (
      draft.catalogs[catalog].some(
        (entry) =>
          entry.label.localeCompare(label, undefined, {
            sensitivity: "accent",
          }) === 0,
      )
    ) {
      setError(labels.duplicate);
      return;
    }
    const entry: CatalogEntry = {
      id: idFor(catalog, label),
      label,
      active: true,
    };
    setDraft((current) => ({
      ...current,
      catalogs: {
        ...current.catalogs,
        [catalog]: [...current.catalogs[catalog], entry],
      },
    }));
    setNewLabels((current) => ({ ...current, [catalog]: "" }));
    setError(undefined);
  };
  const update = (
    catalog: GlobalCatalogKey,
    entryId: string,
    patch: Partial<CatalogEntry>,
  ) =>
    setDraft((current) => ({
      ...current,
      catalogs: {
        ...current.catalogs,
        [catalog]: current.catalogs[catalog].map((entry) =>
          entry.id === entryId ? { ...entry, ...patch } : entry,
        ),
      },
    }));
  const sections = catalogKeys.map((catalog) => {
    const entryName = singularCatalogNames[locale][catalog];
    return (
      <section className="settings-catalog" key={catalog}>
        <h3>{catalogName(catalog)}</h3>
        <div className="settings-add">
          <label>
            <span className="sr-only">{labels.new[catalog]}</span>
            <input
              aria-label={labels.new[catalog]}
              onChange={(event) =>
                setNewLabels((current) => ({
                  ...current,
                  [catalog]: event.target.value,
                }))
              }
              value={newLabels[catalog] ?? ""}
            />
          </label>
          <button
            className="secondary-button"
            onClick={() => add(catalog)}
            type="button"
          >{`${labels.add} ${entryName}`}</button>
        </div>
        {draft.catalogs[catalog].length === 0 ? (
          <p className="muted-copy">{labels.empty}</p>
        ) : (
          <ul className="settings-catalog-list">
            {draft.catalogs[catalog].map((entry) => (
              <li key={entry.id}>
                <input
                  aria-label={`${locale === "es" ? "Editar" : "Edit"}: ${entry.label}`}
                  onChange={(event) =>
                    update(catalog, entry.id, { label: event.target.value })
                  }
                  value={entry.label}
                />
                <label className="toggle-field">
                  <input
                    aria-label={`${labels.active}: ${entry.label}`}
                    checked={entry.active}
                    onChange={(event) =>
                      update(catalog, entry.id, {
                        active: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>{labels.active}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  });
  return (
    <section aria-label={labels.title} className="settings-page">
      <div className="settings-intro">
        <h2>{labels.title}</h2>
        <p>{labels.description}</p>
      </div>
      <section className="settings-formats">
        <h3>{labels.formats}</h3>
        <ul>
          <li>{labels.date}</li>
          <li>{labels.time}</li>
          <li>{labels.number}</li>
        </ul>
      </section>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="settings-grid">{sections}</div>
      <button
        className="primary-button"
        onClick={() => {
          void onSave({ ...draft, updatedAt: new Date().toISOString() });
        }}
        type="button"
      >
        {labels.save}
      </button>
    </section>
  );
}

export function SettingsPage(props: SettingsPageProps) {
  return <SettingsPageState key={props.configuration.updatedAt} {...props} />;
}
