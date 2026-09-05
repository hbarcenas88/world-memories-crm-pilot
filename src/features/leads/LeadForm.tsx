import { useState, type FormEvent } from "react";
import { t, useLocale } from "../../app/i18n";
import { OperationalDateField } from "../../design/components/OperationalDateField";
export type LeadFormValue = Readonly<{
  name: string;
  acquisitionSource: string;
  communicationChannel?: string;
  referredBy?: string;
  residenceCountry: string;
  phone: string;
  email: string;
  destination: string;
  travelType: string;
  requestedDateStatus: "dates_to_define" | "dates_known";
  requestedStartOn?: string;
  requestedEndOn?: string;
  adults?: number;
  children?: number;
  commercialNote?: string;
  budgetAmount?: number;
  budgetCurrency?: "USD" | "MXN";
}>;
const defaultSources = [
  "",
  "Friends & Family",
  "Facebook",
  "Referido",
  "WhatsApp",
  "Instagram",
  "Viaje personal",
  "Cliente",
];
const defaultTravelTypes = [
  "",
  "Paquete Disney",
  "Crucero",
  "Viaje personalizado",
  "Renta auto",
];
const emptyLeadFormValue: LeadFormValue = {
  name: "",
  acquisitionSource: "",
  residenceCountry: "",
  phone: "",
  email: "",
  destination: "",
  travelType: "",
  requestedDateStatus: "dates_to_define",
};
export function LeadForm({
  initialValue,
  onSave,
  onCancel,
  acquisitionSources = defaultSources,
  communicationChannels = [""],
  travelTypes = defaultTravelTypes,
}: {
  initialValue?: LeadFormValue;
  onSave: (value: LeadFormValue) => void;
  onCancel?: () => void;
  acquisitionSources?: readonly string[];
  communicationChannels?: readonly string[];
  travelTypes?: readonly string[];
}) {
  const locale = useLocale();
  const [value, setValue] = useState<LeadFormValue>(
    () => initialValue ?? emptyLeadFormValue,
  );
  const [budgetText, setBudgetText] = useState(
    () => initialValue?.budgetAmount?.toString() ?? "",
  );
  const [error, setError] = useState("");
  const label = (key: import("../../app/i18n").TranslationKey) =>
    t(key, locale);
  const update = <Key extends keyof LeadFormValue>(
    key: Key,
    next: LeadFormValue[Key],
  ) => setValue((current) => ({ ...current, [key]: next }));
  function submit(event: FormEvent) {
    event.preventDefault();
    const budgetAmount = budgetText === "" ? undefined : Number(budgetText);
    if (budgetAmount !== undefined && !value.budgetCurrency) {
      setError(label("budgetCurrencyRequired"));
      return;
    }
    setError("");
    onSave({
      ...value,
      ...(budgetAmount === undefined ? {} : { budgetAmount }),
    });
  }
  const sourceOptions = [
    ...new Set(["", ...acquisitionSources, value.acquisitionSource]),
  ];
  const travelTypeOptions = [
    ...new Set(["", ...travelTypes, value.travelType]),
  ];
  const communicationChannelOptions = [
    ...new Set(["", ...communicationChannels, value.communicationChannel ?? ""]),
  ];
  return (
    <form className="lead-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label>
          {label("nameOrReference")}
          <input
            aria-label={label("nameOrReference")}
            value={value.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label>
          {label("acquisitionSource")}
          <select
            aria-label={label("acquisitionSource")}
            value={value.acquisitionSource}
            onChange={(event) =>
              update("acquisitionSource", event.target.value)
            }
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source || label("selectIfKnown")}
              </option>
            ))}
          </select>
        </label>
        <label>
          {label("communicationChannel")}
          <select
            aria-label={label("communicationChannel")}
            value={value.communicationChannel ?? ""}
            onChange={(event) => update("communicationChannel", event.target.value || undefined)}
          >
            {communicationChannelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {channel || label("selectIfKnown")}
              </option>
            ))}
          </select>
        </label>
        {value.acquisitionSource === "Referido" && (
          <label>
            {label("referredBy")}
            <input
              aria-label={label("referredBy")}
              value={value.referredBy ?? ""}
              onChange={(event) => update("referredBy", event.target.value)}
            />
          </label>
        )}
        <label>
          {label("phone")}
          <input
            aria-label={label("phone")}
            value={value.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </label>
        {value.requestedDateStatus === "dates_known" && <>
          <label>{label("tentativeStart")}<OperationalDateField aria-label={label("tentativeStart")} onChange={(next) => update("requestedStartOn", next)} value={value.requestedStartOn} /></label>
          <label>{label("tentativeEnd")}<OperationalDateField aria-label={label("tentativeEnd")} onChange={(next) => update("requestedEndOn", next)} value={value.requestedEndOn} /></label>
        </>}
        <label>{label("adults")}<input aria-label={label("adults")} inputMode="numeric" min="0" onChange={(event) => update("adults", event.target.value === "" ? undefined : Number(event.target.value))} type="number" value={value.adults ?? ""} /></label>
        <label>{label("children")}<input aria-label={label("children")} inputMode="numeric" min="0" onChange={(event) => update("children", event.target.value === "" ? undefined : Number(event.target.value))} type="number" value={value.children ?? ""} /></label>
        <label>{label("commercialNote")}<textarea aria-label={label("commercialNote")} onChange={(event) => update("commercialNote", event.target.value)} value={value.commercialNote ?? ""} /></label>
        <label>
          {label("email")}
          <input
            aria-label={label("email")}
            type="email"
            value={value.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <label>
          {label("residenceCountry")}
          <input
            aria-label={label("residenceCountry")}
            value={value.residenceCountry}
            onChange={(event) => update("residenceCountry", event.target.value)}
          />
        </label>
        <label>
          {label("initialDestination")}
          <input
            aria-label={label("initialDestination")}
            value={value.destination}
            onChange={(event) => update("destination", event.target.value)}
          />
        </label>
        <label>
          {label("travelType")}
          <select
            aria-label={label("travelType")}
            value={value.travelType}
            onChange={(event) => update("travelType", event.target.value)}
          >
            {travelTypeOptions.map((travelType) => (
              <option key={travelType} value={travelType}>
                {travelType || label("undefinedValue")}
              </option>
            ))}
          </select>
        </label>
        <label>
          {label("dates")}
          <select
            aria-label={label("dates")}
            value={value.requestedDateStatus}
            onChange={(event) =>
              update(
                "requestedDateStatus",
                event.target.value as LeadFormValue["requestedDateStatus"],
              )
            }
          >
            <option value="dates_to_define">{label("datesToDefine")}</option>
            <option value="dates_known">{label("datesKnown")}</option>
          </select>
        </label>
        <label>
          {label("budget")}
          <input
            aria-label={label("budget")}
            inputMode="decimal"
            value={budgetText}
            onChange={(event) => setBudgetText(event.target.value)}
          />
        </label>
        <label>
          {label("currency")}
          <select
            aria-label={label("currency")}
            value={value.budgetCurrency ?? ""}
            onChange={(event) =>
              update(
                "budgetCurrency",
                event.target.value === ""
                  ? undefined
                  : (event.target.value as "USD" | "MXN"),
              )
            }
          >
            <option value="">{label("select")}</option>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {onCancel && (
          <button className="secondary-button" type="button" onClick={onCancel}>
            {label("cancel")}
          </button>
        )}
        <button className="primary-button" type="submit">
          {label("saveLead")}
        </button>
      </div>
    </form>
  );
}
