import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, ChevronRight, Megaphone, MessageCircle, Plane, SlidersHorizontal, UsersRound } from "lucide-react";
import { useLocale } from "../../app/i18n";
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { ToggleSwitch } from '../../design/components/ToggleSwitch';
import type {
  CatalogEntry,
  GlobalCatalogKey,
  WorkspaceConfiguration,
} from "../../domain/types";

type SettingsPageProps = Readonly<{
  configuration: WorkspaceConfiguration;
  onSave: (configuration: WorkspaceConfiguration) => void | Promise<void>;
  onNavigationGuardChange?: (guard: ((proceed: () => void) => void) | undefined) => void;
}>;

type SettingsSection = GlobalCatalogKey | "preferences";

const catalogKeys: readonly GlobalCatalogKey[] = [
  "travelTypes",
  "acquisitionSources",
  "communicationChannels",
  "cancellationReasons",
  "familyRelationships",
];
const catalogIcons: Readonly<Record<GlobalCatalogKey, typeof Plane>> = {
  travelTypes: Plane,
  acquisitionSources: Megaphone,
  communicationChannels: MessageCircle,
  cancellationReasons: Ban,
  familyRelationships: UsersRound,
};
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
    preferences: "Preferencias y formatos",
    preferencesDescription: "Gestiona el idioma de interfaz y consulta los formatos operativos fijos.",
    language: "Idioma",
    travelTypes: "Tipos de viaje",
    acquisitionSources: "Fuentes de adquisición",
    communicationChannels: "Canales de comunicación",
    cancellationReasons: "Motivos de cancelación",
    familyRelationships: "Relaciones familiares",
    open: "Abrir",
    catalogDescriptions: {
      travelTypes: "Define las opciones disponibles al crear o editar un viaje.",
      acquisitionSources: "Organiza cómo llegan las consultas a la agencia.",
      communicationChannels: "Mantiene los canales usados para contactar a cada persona.",
      cancellationReasons: "Explica por qué se cancela un lead o viaje sin perder el historial.",
      familyRelationships: "Define los vínculos disponibles para miembros de una familia.",
    },
    new: {
      travelTypes: "Nuevo tipo de viaje",
      acquisitionSources: "Nueva fuente de adquisición",
      communicationChannels: "Nuevo canal de comunicación",
      cancellationReasons: "Nuevo motivo de cancelación",
      familyRelationships: "Nueva relación familiar",
    },
    add: "Agregar",
    edit: "Editar",
    active: "Activo",
    inactive: "Inactivo",
    availability: "Disponible para nuevas selecciones",
    duplicate: "Ya existe una entrada con este nombre.",
    labelRequired: "Indica un nombre válido para la entrada.",
    empty: "Aún no hay valores. Puedes crear el primero.",
    cancelChanges: "Cancelar cambios",
    discardTitle: "¿Descartar cambios?",
    discardDescription: "Los cambios sin guardar en esta configuración se perderán.",
    keepEditing: "Seguir editando",
    discard: "Descartar cambios",
    saveFailed: "No fue posible guardar la configuración. Revisa los cambios e inténtalo nuevamente.",
    back: "Volver a Configuración",
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
    preferences: "Preferences and formats",
    preferencesDescription: "Manage the interface language and review the fixed operational formats.",
    language: "Language",
    travelTypes: "Travel types",
    acquisitionSources: "Acquisition sources",
    communicationChannels: "Communication channels",
    cancellationReasons: "Cancellation reasons",
    familyRelationships: "Family relationships",
    open: "Open",
    catalogDescriptions: {
      travelTypes: "Defines the options available when creating or editing a trip.",
      acquisitionSources: "Organizes how enquiries reach the agency.",
      communicationChannels: "Keeps the channels used to contact each person.",
      cancellationReasons: "Explains why a lead or trip is cancelled without losing history.",
      familyRelationships: "Defines the relationship choices for family members.",
    },
    new: {
      travelTypes: "New travel type",
      acquisitionSources: "New acquisition source",
      communicationChannels: "New communication channel",
      cancellationReasons: "New cancellation reason",
      familyRelationships: "New family relationship",
    },
    add: "Add",
    edit: "Edit",
    active: "Active",
    inactive: "Inactive",
    availability: "Available for new selections",
    duplicate: "An entry with this name already exists.",
    labelRequired: "Enter a valid name for the entry.",
    empty: "There are no values yet. You can create the first one.",
    cancelChanges: "Cancel changes",
    discardTitle: "Discard changes?",
    discardDescription: "Unsaved changes in these settings will be lost.",
    keepEditing: "Keep editing",
    discard: "Discard changes",
    saveFailed: "The settings could not be saved. Review the changes and try again.",
    back: "Back to settings",
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

function normalizedLabel(label: string): string {
  return label.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

function SettingsPageState({ configuration, onSave, onNavigationGuardChange }: SettingsPageProps) {
  const locale = useLocale();
  const labels = copy[locale];
  const [draft, setDraft] = useState(configuration);
  const [baseConfiguration, setBaseConfiguration] = useState(configuration);
  const lastConfiguration = useRef(configuration);
  const [newLabels, setNewLabels] = useState<
    Partial<Record<GlobalCatalogKey, string>>
  >({});
  const [error, setError] = useState<string | undefined>();
  const [selectedSection, setSelectedSection] = useState<SettingsSection>();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | undefined>();
  const [saving, setSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>();
  const [localeChangedInEditor, setLocaleChangedInEditor] = useState(false);
  const catalogName = (catalog: GlobalCatalogKey) => labels[catalog];
  const hasChanges = draft !== baseConfiguration || Object.values(newLabels).some((value) => Boolean(value?.trim()));
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
  const save = async (): Promise<boolean> => {
    for (const catalog of catalogKeys) {
      const knownLabels = new Set<string>();
      for (const entry of draft.catalogs[catalog]) {
        const label = normalizedLabel(entry.label);
        if (!label) {
          setError(labels.labelRequired);
          return false;
        }
        if (knownLabels.has(label)) {
          setError(labels.duplicate);
          return false;
        }
        knownLabels.add(label);
      }
    }
    setError(undefined);
    setSaving(true);
    try {
      const savedConfiguration = { ...draft, locale: localeChangedInEditor ? draft.locale : configuration.locale, updatedAt: new Date().toISOString() };
      await onSave(savedConfiguration);
      setDraft(savedConfiguration);
      setBaseConfiguration(savedConfiguration);
      setNewLabels({});
      setEditingEntryId(undefined);
      setLocaleChangedInEditor(false);
      return true;
    }
    catch {
      setError(labels.saveFailed);
      return false;
    }
    finally { setSaving(false); }
  };
  const cancelDiscard = () => {
    setConfirmDiscard(false);
    setPendingNavigation(undefined);
  };
  const discardChanges = () => {
    setDraft(configuration);
    setBaseConfiguration(configuration);
    setNewLabels({});
    setError(undefined);
    const proceed = pendingNavigation;
    setPendingNavigation(undefined);
    setConfirmDiscard(false);
    proceed?.();
  };
  const saveAndContinue = async () => {
    if (!await save()) return;
    const proceed = pendingNavigation;
    setPendingNavigation(undefined);
    setConfirmDiscard(false);
    proceed?.();
  };
  useEffect(() => {
    const changedExternally = lastConfiguration.current !== configuration;
    lastConfiguration.current = configuration;
    if (!changedExternally || draft !== baseConfiguration) return undefined;
    const timer = globalThis.setTimeout(() => {
      setDraft(configuration);
      setBaseConfiguration(configuration);
      setEditingEntryId(undefined);
      setLocaleChangedInEditor(false);
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [baseConfiguration, configuration, draft]);
  useEffect(() => {
    if (!onNavigationGuardChange || !hasChanges) return undefined;
    onNavigationGuardChange((proceed) => {
      setPendingNavigation(() => proceed);
      setConfirmDiscard(true);
    });
    return () => onNavigationGuardChange(undefined);
  }, [hasChanges, onNavigationGuardChange]);
  const catalogEditor = selectedSection === undefined || selectedSection === "preferences" ? undefined : (() => {
    const catalog = selectedSection;
    const entryName = singularCatalogNames[locale][catalog];
    return <section className="settings-catalog-editor" aria-label={catalogName(catalog)}>
      <button className="text-button settings-back" onClick={() => setSelectedSection(undefined)} type="button"><ArrowLeft aria-hidden="true" size={17} />{labels.back}</button>
      <div className="settings-catalog-editor-header"><div><h3>{catalogName(catalog)}</h3><p className="muted-copy">{labels.description}</p></div><small>{draft.catalogs[catalog].filter((entry) => entry.active).length} / {draft.catalogs[catalog].length}</small></div>
        <div className="settings-add">
          <label>
            <span>{labels.new[catalog]}</span>
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
                {editingEntryId === entry.id ? <input
                  aria-label={`${labels.edit}: ${entry.label}`}
                  onChange={(event) =>
                    update(catalog, entry.id, { label: event.target.value })
                  }
                  value={entry.label}
                /> : <span className="settings-catalog-label">{entry.label}</span>}
                {editingEntryId !== entry.id && <button
                  aria-label={`${labels.edit}: ${entry.label}`}
                  className="text-button"
                  onClick={() => { setEditingEntryId(entry.id); setError(undefined); }}
                  type="button"
                >{labels.edit}</button>}
                <span className="toggle-field"><ToggleSwitch checked={entry.active} label={`${labels.availability}: ${entry.label}`} onChange={(active) => update(catalog, entry.id, { active })} /><span>{entry.active ? labels.active : labels.inactive}</span></span>
              </li>
            ))}
          </ul>
        )}
    </section>;
  })();
  const preferencesEditor = selectedSection === "preferences" ? <section className="settings-catalog-editor" aria-label={labels.preferences}>
    <button className="text-button settings-back" onClick={() => setSelectedSection(undefined)} type="button"><ArrowLeft aria-hidden="true" size={17} />{labels.back}</button>
    <div className="settings-catalog-editor-header"><div><h3>{labels.preferences}</h3><p className="muted-copy">{labels.preferencesDescription}</p></div></div>
    <div className="form-grid">
      <label>{labels.language}<select aria-label={labels.language} onChange={(event) => { setLocaleChangedInEditor(true); setDraft((current) => ({ ...current, locale: event.target.value as WorkspaceConfiguration["locale"] })); }} value={draft.locale}><option value="es">ES</option><option value="en">EN</option></select></label>
    </div>
    <section className="settings-formats" aria-label={labels.formats}>
      <h4>{labels.formats}</h4>
      <ul><li>{labels.date}</li><li>{labels.time}</li><li>{labels.number}</li></ul>
    </section>
  </section> : undefined;
  return (
    <section aria-label={labels.title} className="settings-page">
      <div className="settings-intro">
        <h2>{labels.title}</h2>
        <p>{labels.description}</p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {catalogEditor ?? preferencesEditor ?? <div className="settings-grid">{catalogKeys.map((catalog) => {
        const Icon = catalogIcons[catalog];
        const activeCount = draft.catalogs[catalog].filter((entry) => entry.active).length;
        return <button aria-label={`${labels.open} ${catalogName(catalog)}`} className="settings-catalog settings-catalog-trigger" key={catalog} onClick={() => setSelectedSection(catalog)} type="button">
          <span aria-hidden="true" className="settings-catalog-icon"><Icon size={22} /></span>
          <span className="settings-catalog-copy"><strong>{catalogName(catalog)}</strong><small className="settings-catalog-description">{labels.catalogDescriptions[catalog]}</small><small>{activeCount} / {draft.catalogs[catalog].length}</small></span>
          <span aria-hidden="true" className="settings-catalog-open"><span>{labels.open}</span><ChevronRight size={20} /></span>
        </button>;
      })}<button aria-label={`${labels.open} ${labels.preferences}`} className="settings-catalog settings-catalog-trigger" onClick={() => setSelectedSection("preferences")} type="button">
        <span aria-hidden="true" className="settings-catalog-icon"><SlidersHorizontal size={22} /></span>
        <span className="settings-catalog-copy"><strong>{labels.preferences}</strong><small className="settings-catalog-description">{labels.preferencesDescription}</small><small>{labels.formats}</small></span>
        <span aria-hidden="true" className="settings-catalog-open"><span>{labels.open}</span><ChevronRight size={20} /></span>
      </button></div>}
      <div className="form-actions">
        {hasChanges && <button className="secondary-button" disabled={saving} onClick={() => setConfirmDiscard(true)} type="button">{labels.cancelChanges}</button>}
        <button
          className="primary-button"
          disabled={saving}
          onClick={() => { void save(); }}
          type="button"
        >
          {labels.save}
        </button>
      </div>
      {confirmDiscard && <ConfirmDialog actions={<><button className="secondary-button" data-dialog-safe onClick={cancelDiscard} type="button">{labels.keepEditing}</button>{pendingNavigation && <button className="primary-button" disabled={saving} onClick={() => { void saveAndContinue(); }} type="button">{labels.save}</button>}<button className="danger-button" disabled={saving} onClick={discardChanges} type="button">{labels.discard}</button></>} onCancel={cancelDiscard} title={labels.discardTitle}><p>{labels.discardDescription}</p></ConfirmDialog>}
    </section>
  );
}

export function SettingsPage(props: SettingsPageProps) {
  return <SettingsPageState {...props} />;
}
