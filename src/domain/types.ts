export type Currency = "USD" | "MXN";

export type WorkspaceLocale = "es" | "en";
export type GlobalCatalogKey =
  | "travelTypes"
  | "acquisitionSources"
  | "communicationChannels"
  | "cancellationReasons"
  | "familyRelationships";
export type CatalogEntry = Readonly<{
  id: string;
  label: string;
  active: boolean;
}>;
export type WorkspaceConfiguration = Readonly<{
  id: "workspace-configuration";
  locale: WorkspaceLocale;
  dateFormat: "DD/MM/YYYY";
  timeFormat: "HH:mm";
  numberFormat: "1,234.56";
  catalogs: Readonly<Record<GlobalCatalogKey, readonly CatalogEntry[]>>;
  updatedAt: string;
}>;

export type Money = Readonly<{
  amount: number;
  currency: Currency;
}>;

export type MoneyTotals = Readonly<Record<Currency, number>>;

export type DateRange = Readonly<{
  startOn: string;
  endOn: string;
}>;

export type LeadStatus =
  | "new"
  | "contacted"
  | "quote_preparing"
  | "quote_sent"
  | "follow_up"
  | "review_adjustments"
  | "paused"
  | "sold"
  | "cancelled";

export type LeadDraft = Readonly<{
  name: string;
  acquisitionSource: string;
  communicationChannel?: string;
  requestedDateStatus: "dates_to_define" | "dates_known";
  requestedStartOn?: string;
  requestedEndOn?: string;
  adults?: number;
  children?: number;
  commercialNote?: string;
  cancellationReasonId?: string;
  cancellationReasonNote?: string;
  initialStatus?: Extract<LeadStatus, "new" | "contacted">;
  referredBy?: string;
  residenceCountry?: string;
  address?: string;
  phone?: string;
  email?: string;
  destination?: string;
  travelType?: string;
  budget?: Money;
}>;

export type Lead = Readonly<
  LeadDraft & {
    id: string;
    status: LeadStatus;
    createdAt: string;
    clientId?: string;
    tripId?: string;
    archivedAt?: string;
  }
>;

export type FamilyMember = Readonly<{
  id: string;
  name: string;
  birthDate?: string;
  relationship?: string;
  status: "active" | "archived";
}>;

export type ClientDraft = Readonly<{
  name: string;
  familyNote?: string;
  residenceCountry?: string;
  address?: string;
  phone?: string;
  email?: string;
  members?: readonly FamilyMember[];
}>;

export type Client = Readonly<
  ClientDraft & {
  id: string;
  createdAt: string;
  lastSavedAt?: string;
  archivedAt?: string;
  }
>;
export type Trip = Readonly<{
  id: string;
  leadId: string;
  clientId: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  computedStartOn?: string;
  computedEndOn?: string;
  overrideStartOn?: string;
  overrideEndOn?: string;
  effectiveStartOn?: string;
  effectiveEndOn?: string;
  primaryMemberId?: string;
  travelerMemberIds?: readonly string[];
  referenceCurrency?: Currency;
  referenceRateBaseCurrency?: Currency;
  referenceRateQuoteCurrency?: Currency;
  referenceExchangeRate?: number;
  referenceExchangeRateLockedAt?: string;
  lastSavedAt?: string;
  archivedAt?: string;
}>;

export type Service = Readonly<{
  id: string;
  tripId: string;
  name: string;
  status: "active" | "cancelled";
  startOn?: string;
  endOn?: string;
  createdAt: string;
  archivedAt?: string;
}>;

export type RichNote = Readonly<{
  id: string;
  ownerType: "client" | "trip";
  ownerId: string;
  content: string;
  updatedAt: string;
}>;

export type Provider = Readonly<{
  id: string;
  name: string;
  status: "active" | "inactive";
  allowedCurrencies: readonly Currency[];
  commissionRate?: 0.8 | 1;
  grossCommissionMode?: "fixed_percentage" | "variable_amount_per_service";
  defaultGrossRate?: number;
  commissionDueDays?: number;
  contactName?: string;
  phone?: string;
  email?: string;
  internalNote?: string;
  references?: readonly string[];
  serviceTypes?: readonly string[];
  createdAt: string;
  archivedAt?: string;
}>;

export type ServiceProvider = Readonly<{
  id: string;
  serviceId: string;
  providerId: string;
  currency: Currency;
  saleAmount?: number;
  reservationLocator?: string;
  customerBalanceDueOn?: string;
  commissionStatus: "with_commission" | "without_commission";
  cancellationOutcome?: "refunded" | "non_refundable" | "partial";
  cancelledAt?: string;
  variableGrossCommissionAmount?: number;
  createdAt: string;
}>;

export type ServiceAdditionalItem = Readonly<{
  id: string;
  serviceId: string;
  label: string;
  amount: number;
  currency: Currency;
  createdAt: string;
}>;

export type ProviderTaskTemplate = Readonly<{
  id: string;
  providerId: string;
  title: string;
  required: boolean;
  relativeTo: "trip_start" | "trip_end" | "manual";
  offsetDays?: number;
  offsetMonths?: number;
  active: boolean;
  createdAt: string;
}>;

export type Commission = Readonly<{
  id: string;
  tripId: string;
  providerId: string;
  serviceProviderId?: string;
  expected: Money;
  grossAmount?: Money;
  grossCommissionMode?: "fixed_percentage" | "variable_amount_per_service";
  grossRate?: number;
  agencyShareRate?: 0.8 | 1;
  dueOn?: string;
  trackingReference?: string;
  status: "expected" | "paid" | "cancelled";
  received?: Money;
  paidOn?: string;
  paymentNote?: string;
  projectionRateBaseCurrency?: Currency;
  projectionRateQuoteCurrency?: Currency;
  projectionExchangeRate?: number;
  projectionRateSource?: "trip_reference" | "commission_override";
  projectedReferenceAmount?: Money;
  createdAt: string;
  archivedAt?: string;
}>;
export type Payment = Readonly<{
  id: string;
  tripId: string;
  amount: Money;
  occurredAt: string;
  recordedAt: string;
  status: "received";
  source: "first_conversion_payment" | "customer_payment";
  serviceProviderId?: string;
  archivedAt?: string;
}>;

export type BackupDownload = Readonly<{
  id: string;
  kind: "full_json" | "operational_excel";
  downloadedAt: string;
  schemaVersion: number;
  reminderDismissedUntil?: string;
}>;

export type ActivityEvent = Readonly<{
  id: string;
  aggregateType:
    | "lead"
    | "client"
    | "trip"
    | "service"
    | "provider"
    | "payment"
    | "task"
    | "commission";
  aggregateId: string;
  type: string;
  occurredAt: string;
  recordedAt: string;
  payload: Record<string, unknown>;
}>;

export type TaskDraft = Readonly<{
  title: string;
  required: boolean;
  dueOn?: string;
  dueTime?: string;
}>;

export type Task = Readonly<
  TaskDraft & {
    id: string;
    status: "open" | "completed";
    leadId?: string;
    tripId?: string;
    serviceProviderId?: string;
    commissionId?: string;
    templateId?: string;
    source?:
      | "manual"
      | "lead_follow_up"
      | "provider_template"
      | "commission_follow_up";
    dueDateSource?: "manual" | "template";
    requiresManualDateReview?: boolean;
    templateSnapshot?: Readonly<{
      title: string;
      required: boolean;
      relativeTo: ProviderTaskTemplate["relativeTo"];
      offsetDays?: number;
      offsetMonths?: number;
    }>;
    createdAt: string;
    completedAt?: string;
    archivedAt?: string;
  }
>;
