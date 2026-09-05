import { useMemo, useState } from "react";
import { t, useLocale } from "../../app/i18n";
import type { Currency, Provider, Service, ServiceProvider } from "../../domain/types";
import { OperationalDateField } from "../../design/components/OperationalDateField";

export type ServiceProviderAssignmentValue = Readonly<{
  serviceId: string;
  providerId: string;
  currency: Currency;
  amount?: number;
  reservationLocator?: string;
  variableGrossCommissionAmount?: number;
  customerBalanceDueOn?: string;
  commissionStatus: ServiceProvider['commissionStatus'];
}>;
export type SuggestedProviderTaskValue = Readonly<{
  templateId?: string;
  title: string;
  required: boolean;
  dueOn?: string;
  templateSnapshot?: import("../../domain/types").Task["templateSnapshot"];
}>;
export type ProviderAssignmentResult = Readonly<{
  serviceProvider: Readonly<{ id: string }>;
  suggestedTasks: readonly SuggestedProviderTaskValue[];
}>;
type PendingSuggestedProviderTask = SuggestedProviderTaskValue &
  Readonly<{ selected?: boolean }>;

export function ServiceProviderAssignment({
  services,
  providers,
  onAssign,
  onCreateSuggestedTasks,
  onReactivateProvider,
}: Readonly<{
  services: readonly Service[];
  providers: readonly Provider[];
  onAssign: (
    value: ServiceProviderAssignmentValue,
  ) => Promise<ProviderAssignmentResult>;
  onCreateSuggestedTasks: (
    serviceProviderId: string,
    tasks: readonly SuggestedProviderTaskValue[],
  ) => Promise<void>;
  onReactivateProvider: (providerId: string) => Promise<void>;
}>) {
  const locale = useLocale();
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [amount, setAmount] = useState("");
  const [reservationLocator, setReservationLocator] = useState("");
  const [variableGrossCommissionAmount, setVariableGrossCommissionAmount] =
    useState("");
  const [customerBalanceDueOn, setCustomerBalanceDueOn] = useState("");
  const [commissionStatus, setCommissionStatus] = useState<ServiceProvider['commissionStatus']>('with_commission');
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<
    | Readonly<{
        serviceProviderId: string;
        tasks: readonly PendingSuggestedProviderTask[];
      }>
    | undefined
  >();
  const [reactivatedProviderIds, setReactivatedProviderIds] = useState<
    readonly string[]
  >([]);
  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === providerId),
    [providerId, providers],
  );

  async function assign(allowReactivatedProvider = false): Promise<void> {
    const parsedAmount = amount.trim() === "" ? undefined : Number(amount);
    const parsedVariableGross =
      variableGrossCommissionAmount.trim() === ""
        ? undefined
        : Number(variableGrossCommissionAmount);
    if (
      !serviceId ||
      !selectedProvider ||
      !currency ||
      (parsedAmount !== undefined &&
        (!Number.isFinite(parsedAmount) || parsedAmount < 0)) ||
      (parsedVariableGross !== undefined &&
        (!Number.isFinite(parsedVariableGross) || parsedVariableGross < 0))
    ) {
      setError(t("selectServiceProviderCurrency", locale));
      return;
    }
    if (
      selectedProvider.status === "inactive" &&
      !allowReactivatedProvider &&
      !reactivatedProviderIds.includes(selectedProvider.id)
    ) {
      setError(t("providerInactive", locale));
      return;
    }
    setIsSaving(true);
    setError(undefined);
    try {
      const result = await onAssign({
        serviceId,
        providerId: selectedProvider.id,
        currency,
        ...(parsedAmount === undefined ? {} : { amount: parsedAmount }),
        ...(reservationLocator.trim() ? { reservationLocator: reservationLocator.trim() } : {}),
        ...(parsedVariableGross === undefined
          ? {}
          : { variableGrossCommissionAmount: parsedVariableGross }),
        ...(customerBalanceDueOn ? { customerBalanceDueOn } : {}),
        commissionStatus,
      });
      setPendingSuggestions(
        result.suggestedTasks.length > 0
          ? {
              serviceProviderId: result.serviceProvider.id,
              tasks: result.suggestedTasks,
            }
          : undefined,
      );
      setAmount("");
      setReservationLocator("");
      setVariableGrossCommissionAmount("");
      setCustomerBalanceDueOn("");
      setCommissionStatus('with_commission');
    } catch {
      setError(t("providerCouldNotBeAdded", locale));
    } finally {
      setIsSaving(false);
    }
  }

  async function reactivateAndAssign(): Promise<void> {
    if (!selectedProvider) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await onReactivateProvider(selectedProvider.id);
      setReactivatedProviderIds((current) => [
        ...new Set([...current, selectedProvider.id]),
      ]);
    } catch {
      setError(t("providerCouldNotBeActivated", locale));
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    await assign(true);
  }

  async function createSelectedTasks(): Promise<void> {
    if (!pendingSuggestions) return;
    const selected = pendingSuggestions.tasks
      .filter((task) => task.selected !== false)
      .map((task) => ({
        ...(task.templateId ? { templateId: task.templateId } : {}),
        title: task.title,
        required: task.required,
        ...(task.dueOn ? { dueOn: task.dueOn } : {}),
        ...(task.templateSnapshot
          ? { templateSnapshot: task.templateSnapshot }
          : {}),
      }));
    if (selected.some((task) => task.title.trim() === "")) {
      setError(t("selectedTaskNeedsTitle", locale));
      return;
    }
    setIsSaving(true);
    setError(undefined);
    try {
      await onCreateSuggestedTasks(
        pendingSuggestions.serviceProviderId,
        selected,
      );
      setPendingSuggestions(undefined);
    } catch {
      setError(t("providerTasksCouldNotBeCreated", locale));
    } finally {
      setIsSaving(false);
    }
  }

  function updateSuggestion(
    index: number,
    update: Partial<PendingSuggestedProviderTask>,
  ): void {
    if (!pendingSuggestions) return;
    setPendingSuggestions({
      ...pendingSuggestions,
      tasks: pendingSuggestions.tasks.map((task, currentIndex) =>
        currentIndex === index ? { ...task, ...update } : task,
      ),
    });
  }

  if (services.length === 0)
    return <p className="muted-copy">{t("saveServiceFirst", locale)}</p>;
  if (providers.length === 0)
    return <p className="muted-copy">{t("createProviderFirst", locale)}</p>;

  return (
    <section
      aria-label={t("assignProviderToService", locale)}
      className="provider-assignment"
    >
      <div className="form-grid">
        <label>
          {t("service", locale)}
          <select
            aria-label={t("serviceForProvider", locale)}
            onChange={(event) => setServiceId(event.target.value)}
            value={serviceId}
          >
            <option value="">{t("select", locale)}</option>
            {services
              .filter(
                (service) => service.status === "active" && !service.archivedAt,
              )
              .map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("provider", locale)}
          <select
            aria-label={t("providerForService", locale)}
            onChange={(event) => {
              setProviderId(event.target.value);
              setCurrency("");
              setVariableGrossCommissionAmount("");
            }}
            value={providerId}
          >
            <option value="">{t("select", locale)}</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
                {provider.status === "inactive"
                  ? ` · ${t("inactiveStatus", locale)}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("currency", locale)}
          <select
            aria-label={t("componentCurrency", locale)}
            disabled={!selectedProvider}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            value={currency}
          >
            <option value="">{t("select", locale)}</option>
            {selectedProvider?.allowedCurrencies.map((allowedCurrency) => (
              <option key={allowedCurrency} value={allowedCurrency}>
                {allowedCurrency}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("saleAmount", locale)}
          <input
            aria-label={t("saleAmount", locale)}
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            step="0.01"
            type="number"
            value={amount}
          />
        </label>
        <label>
          {t("componentCommission", locale)}
          <select aria-label={t("componentCommission", locale)} onChange={(event) => setCommissionStatus(event.target.value as ServiceProvider['commissionStatus'])} value={commissionStatus}>
            <option value="with_commission">{t("withCommission", locale)}</option>
            <option value="without_commission">{t("withoutCommission", locale)}</option>
          </select>
        </label>
        <label>
          {t("reservationLocator", locale)}
          <input aria-label={t("reservationLocator", locale)} onChange={(event) => setReservationLocator(event.target.value)} value={reservationLocator} />
        </label>
        {selectedProvider?.grossCommissionMode ===
          "variable_amount_per_service" && (
          <label>
            {t("expectedGrossCommission", locale)}
            <input
              aria-label={t("expectedGrossCommission", locale)}
              inputMode="decimal"
              min="0"
              onChange={(event) =>
                setVariableGrossCommissionAmount(event.target.value)
              }
              step="0.01"
              type="number"
              value={variableGrossCommissionAmount}
            />
          </label>
        )}
        <label>
          {t("customerBalanceDueDate", locale)}
          <OperationalDateField
            aria-label={t("customerBalanceDueDate", locale)}
            onChange={setCustomerBalanceDueOn}
            value={customerBalanceDueOn}
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {selectedProvider?.status === "inactive" &&
      !reactivatedProviderIds.includes(selectedProvider.id) ? (
        <button
          className="secondary-button"
          disabled={isSaving}
          onClick={() => {
            void reactivateAndAssign();
          }}
          type="button"
        >
          {isSaving ? t("activating", locale) : t("activateAndUse", locale)}
        </button>
      ) : (
        <button
          className="secondary-button"
          disabled={isSaving}
          onClick={() => {
            void assign();
          }}
          type="button"
        >
          {isSaving
            ? t("addingProvider", locale)
            : t("addProviderToService", locale)}
        </button>
      )}
      {pendingSuggestions && (
        <section
          aria-label={t("suggestedProviderTasks", locale)}
          className="suggested-task-selection"
        >
          <h3>{t("suggestedTasks", locale)}</h3>
          <p className="muted-copy">{t("suggestedTasksDescription", locale)}</p>
          {pendingSuggestions.tasks.map((task, index) => (
            <div
              className="suggested-task-row"
              key={`${task.templateId ?? task.title}-${index}`}
            >
              <label>
                <input
                  aria-label={t("includeSuggestedTask", locale, {
                    number: index + 1,
                  })}
                  checked={task.selected !== false}
                  onChange={(event) =>
                    updateSuggestion(index, { selected: event.target.checked })
                  }
                  type="checkbox"
                />
                {task.required
                  ? t("requiredRecommended", locale)
                  : t("include", locale)}
              </label>
      <input
        aria-label={t("suggestedTask", locale, { number: index + 1 })}
                onChange={(event) =>
                  updateSuggestion(index, { title: event.target.value })
                }
        value={task.title}
      />
      <OperationalDateField
        aria-label={t("newDateFor", locale, { task: task.title })}
        onChange={(dueOn) => updateSuggestion(index, { dueOn: dueOn || undefined })}
        value={task.dueOn}
      />
            </div>
          ))}
          <button
            className="secondary-button"
            disabled={isSaving}
            onClick={() => {
              void createSelectedTasks();
            }}
            type="button"
          >
            {t("createSelectedTasks", locale)}
          </button>
        </section>
      )}
    </section>
  );
}
