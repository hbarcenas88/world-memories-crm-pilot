import { Search } from "lucide-react";
import { useState } from "react";
import type { Locale } from "../../app/i18n";
import { t } from "../../app/i18n";
import { EmptyState } from "../../design/components/EmptyState";
import { ArchiveFilterChips } from "../../design/components/ArchiveFilterChips";
import type { Lead } from "../../domain/types";
import { LeadForm, type LeadFormValue } from "./LeadForm";

function formValue(lead: Lead): LeadFormValue {
  return {
    name: lead.name,
    acquisitionSource: lead.acquisitionSource,
    communicationChannel: lead.communicationChannel,
    referredBy: lead.referredBy,
    residenceCountry: lead.residenceCountry ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    destination: lead.destination ?? "",
    travelType: lead.travelType ?? "",
    requestedDateStatus: lead.requestedDateStatus,
    requestedStartOn: lead.requestedStartOn,
    requestedEndOn: lead.requestedEndOn,
    adults: lead.adults,
    children: lead.children,
    commercialNote: lead.commercialNote,
    budgetAmount: lead.budget?.amount,
    budgetCurrency: lead.budget?.currency,
  };
}
const leadStatusKeys: Record<
  Lead["status"],
  import("../../app/i18n").TranslationKey
> = {
  new: "leadReceived",
  contacted: "leadContacted",
  quote_preparing: "prepareQuote",
  quote_sent: "quoteSent",
  follow_up: "leadFollowUp",
  review_adjustments: "leadReviewAdjustments",
  paused: "leadPaused",
  sold: "leadConverted",
  cancelled: "leadCancelled",
};
export function LeadList({
  editingLead,
  locale,
  leads,
  showForm,
  onSave,
  onCancel,
  onSelect,
  acquisitionSources,
  communicationChannels,
  travelTypes,
}: {
  editingLead?: Lead;
  locale: Locale;
  leads: readonly Lead[];
  showForm: boolean;
  onSave: (value: LeadFormValue) => void;
  onCancel: () => void;
  onSelect: (lead: Lead) => void;
  acquisitionSources?: readonly string[];
  communicationChannels?: readonly string[];
  travelTypes?: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<
    "active" | "archived" | "all"
  >("active");
  const label = (key: import("../../app/i18n").TranslationKey) =>
    t(key, locale);
  const filteredLeads = leads.filter(
    (lead) =>
      [lead.name, lead.email, lead.phone, lead.destination].some((field) =>
        field?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ) &&
      (source === "" || lead.acquisitionSource === source) &&
      (status === "" || lead.status === status) &&
      (archiveFilter === "all" || archiveFilter === "archived"
        ? Boolean(lead.archivedAt)
        : !lead.archivedAt),
  );
  const sources = [
    ...new Set(leads.map((lead) => lead.acquisitionSource).filter(Boolean)),
  ];
  return (
    <div className="lead-layout">
      {showForm ? (
        <LeadForm
          acquisitionSources={acquisitionSources}
          communicationChannels={communicationChannels}
          initialValue={editingLead ? formValue(editingLead) : undefined}
          onCancel={onCancel}
          onSave={onSave}
          travelTypes={travelTypes}
        />
      ) : (
        <>
          <div className="lead-toolbar">
            <label className="search-field" htmlFor="lead-search">
              <Search aria-hidden="true" size={19} />
              <input
                id="lead-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={label("leadSearchPlaceholder")}
              />
            </label>
            <select
              aria-label={label("filterBySource")}
              className="toolbar-select"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option value="">{label("allSources")}</option>
              {sources.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              aria-label={label("filterByStatus")}
              className="toolbar-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">{label("allStatuses")}</option>
              {(Object.keys(leadStatusKeys) as Lead["status"][]).map((item) => (
                <option key={item} value={item}>
                  {label(leadStatusKeys[item])}
                </option>
              ))}
            </select>
          </div>
          <ArchiveFilterChips
            onChange={setArchiveFilter}
            value={archiveFilter}
          />
          {filteredLeads.length === 0 ? (
            <EmptyState
              title={t("emptyTitle", locale)}
              body={label("leadsEmpty")}
            />
          ) : (
            <section className="lead-table" aria-label={label("leadList")}>
              <div className="lead-table-header">
                <span>{label("name")}</span>
                <span>{label("source")}</span>
                <span>{label("destination")}</span>
                <span>{label("status")}</span>
              </div>
              {filteredLeads.map((lead) => (
                <button
                  className="lead-row"
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                >
                  <strong>{lead.name || label("unnamed")}</strong>
                  <span>
                    {lead.acquisitionSource || label("undefinedValue")}
                  </span>
                  <span>{lead.destination || label("undefinedValue")}</span>
                  <span>
                    {lead.archivedAt ? (
                      <span className="status-chip">
                        {label("archivedRecord")}
                      </span>
                    ) : (
                      label(leadStatusKeys[lead.status])
                    )}
                  </span>
                </button>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
