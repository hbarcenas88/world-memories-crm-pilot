import {
  CalendarDays,
  CircleDollarSign,
  DatabaseBackup,
  FolderCog,
  Home,
  LayoutList,
  ListTodo,
  Menu,
  Settings,
  UsersRound,
  UserRoundPlus,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  LocaleProvider,
  t,
  useLocale,
  type Locale,
  type TranslationKey,
} from "./i18n";
import { routeFromHash, routeHash, routeKeys, routeTargetFromHash, type RouteKey } from "./router";
import { Button } from "../design/components/Button";
import { DetailWorkspace } from "../design/components/DetailWorkspace";
import { ResizableDetailPanel } from "../design/components/ResizableDetailPanel";
import { ToastRegion } from "../design/components/ToastRegion";
import { EmptyState } from "../design/components/EmptyState";
import { LeadList } from "../features/leads/LeadList";
import { workspaceRepository } from "./workspace";
import { createLead as createLeadOperation } from "../application/use-cases/createLead";
import { updateLead as updateLeadOperation } from "../application/use-cases/updateLead";
import { updateClient as updateClientOperation } from "../application/use-cases/updateClient";
import { createClient as createClientOperation } from "../application/use-cases/createClient";
import { archiveRecord as archiveRecordOperation } from "../application/use-cases/archiveRecord";
import { deleteRecord as deleteRecordOperation } from "../application/use-cases/deleteRecord";
import { restoreRecord as restoreRecordOperation } from "../application/use-cases/restoreRecord";
import { transitionLead as transitionLeadOperation } from "../application/use-cases/transitionLead";
import { convertLead as convertLeadOperation } from "../application/use-cases/convertLead";
import { completeTask as completeTaskOperation } from "../application/use-cases/completeTask";
import { rescheduleTask as rescheduleTaskOperation } from "../application/use-cases/rescheduleTask";
import { reopenTask as reopenTaskOperation } from "../application/use-cases/reopenTask";
import { createManualTask as createManualTaskOperation, updateManualTask as updateManualTaskOperation } from "../application/use-cases/manualTask";
import { resolveTemplateTaskDateReview as resolveTemplateTaskDateReviewOperation } from "../application/use-cases/resolveTemplateTaskDateReview";
import { reconcileWorkspace as reconcileWorkspaceOperation } from "../application/use-cases/reconcileWorkspace";
import { markCommissionPaid as markCommissionPaidOperation } from "../application/use-cases/markCommissionPaid";
import { recordCustomerPayment as recordCustomerPaymentOperation } from "../application/use-cases/recordCustomerPayment";
import { correctCustomerPayment as correctCustomerPaymentOperation } from "../application/use-cases/correctCustomerPayment";
import { saveTripWorkspace as saveTripWorkspaceOperation } from "../application/use-cases/saveTripWorkspace";
import { saveProvider as saveProviderOperation } from "../application/use-cases/saveProvider";
import { addProviderToService as addProviderToServiceOperation } from "../application/use-cases/addProviderToService";
import { assignInitialPaymentToServiceProvider as assignInitialPaymentOperation } from "../application/use-cases/assignInitialPaymentToServiceProvider";
import { saveProviderTaskTemplate as saveProviderTaskTemplateOperation } from "../application/use-cases/saveProviderTaskTemplate";
import { createSuggestedProviderTasks as createSuggestedProviderTasksOperation } from "../application/use-cases/createSuggestedProviderTasks";
import { reactivateProvider as reactivateProviderOperation } from "../application/use-cases/reactivateProvider";
import { updateCommissionTracking as updateCommissionTrackingOperation } from "../application/use-cases/updateCommissionTracking";
import { updateCommissionProjectionRate as updateCommissionProjectionRateOperation } from "../application/use-cases/updateCommissionProjectionRate";
import { enableCommissionForServiceProvider as enableCommissionForServiceProviderOperation } from "../application/use-cases/enableCommissionForServiceProvider";
import { recordServiceProviderCancellation as recordServiceProviderCancellationOperation } from "../application/use-cases/recordServiceProviderCancellation";
import { cancelTrip as cancelTripOperation } from "../application/use-cases/cancelTrip";
import type {
  ActivityEvent,
  BackupDownload,
  CatalogEntry,
  Client,
  Commission,
  Currency,
  Lead,
  LeadStatus,
  Payment,
  Provider,
  RichNote,
  Service,
  ServiceAdditionalItem,
  ServiceProvider,
  Task,
  Trip,
  WorkspaceConfiguration,
} from "../domain/types";
import type { LeadFormValue } from "../features/leads/LeadForm";
import type { TaskFormValue } from "../features/tasks/TaskForm";
import type { WorkspaceRepository } from "../application/ports";
import { LeadDetail } from "../features/leads/LeadDetail";
import { RecordActions } from "../features/records/RecordActions";
import { ClientList } from "../features/clients/ClientList";
import { ClientDetail } from "../features/clients/ClientDetail";
import {
  ClientForm,
  type ClientFormValue,
} from "../features/clients/ClientForm";
import { TripList } from "../features/trips/TripList";
import type { TripWorkspaceDraft } from "../features/trips/TripDetail";
import type { CustomerPaymentComponent } from "../features/trips/CustomerPaymentPanel";
import type {
  ProviderAssignmentResult,
  ServiceProviderAssignmentValue,
  SuggestedProviderTaskValue,
} from "../features/trips/ServiceProviderAssignment";
import { ProviderList } from "../features/providers/ProviderList";
import {
  ProviderDetail,
  type ProviderFormValue,
} from "../features/providers/ProviderDetail";
import type { ProviderTaskTemplateValue } from "../features/providers/ProviderTaskTemplates";
import { CommissionBoard } from "../features/commissions/CommissionBoard";
import { CommissionDetail } from "../features/commissions/CommissionDetail";
import { CommissionPaymentDialog } from "../features/commissions/CommissionPaymentDialog";
import { TaskBoard } from "../features/tasks/TaskBoard";
import { TaskDetail } from "../features/tasks/TaskDetail";
import { ServiceDetail } from "../features/trips/ServiceDetail";
import { PaymentDetail } from "../features/trips/PaymentDetail";
import { Dashboard } from "../features/dashboard/Dashboard";
import { CalendarPage } from "../features/calendar/CalendarPage";
import { GlobalSearch } from "../features/search/GlobalSearch";
import type { SearchResult } from "../features/search/globalSearchModel";
import { NotificationCenter } from "../features/notifications/NotificationCenter";
import { hasCurrentJsonBackup } from "../features/data/updateBackupGuard";
import {
  buildWorkspaceNotifications,
  type WorkspaceNotification,
} from "../features/notifications/notificationModel";
import { SettingsPage } from "../features/settings/SettingsPage";
import { createDefaultWorkspaceConfiguration } from "../domain/workspaceConfiguration";
import { workspaceSnapshotVersion } from "../application/workspaceSnapshot";
import "../design/global.css";

const icons: Record<RouteKey, typeof Home> = {
  dashboard: Home,
  leads: UserRoundPlus,
  clients: UsersRound,
  trips: LayoutList,
  calendar: CalendarDays,
  tasks: ListTodo,
  commissions: CircleDollarSign,
  providers: FolderCog,
  data: DatabaseBackup,
  settings: Settings,
};
const TripDetail = lazy(async () => ({
  default: (await import("../features/trips/TripDetail")).TripDetail,
}));
const DataBackupsPage = lazy(async () => ({
  default: (await import("../features/data/DataBackupsPage")).DataBackupsPage,
}));
type UndoArchiveToast = Readonly<{
  kind:
    | "lead"
    | "client"
    | "provider"
    | "trip"
    | "task"
    | "commission"
    | "service"
    | "payment";
  id: string;
  message: string;
}>;

function Page({ title, children }: { title: string; children?: ReactNode }) {
  const locale = useLocale();
  return (
    <>
      <div className="page-heading">
        <h1>{title}</h1>
      </div>
      {children ?? (
        <EmptyState
          title={t("comingSoon", locale)}
          body={t("comingSoonDescription", locale)}
        />
      )}
    </>
  );
}

export function App({
  repository: repositoryOverride,
  applyUpdate,
  onDeferUpdate,
  requiresBackupForUpdate = false,
}: {
  repository?: WorkspaceRepository;
  applyUpdate?: () => Promise<void>;
  onDeferUpdate?: () => void;
  requiresBackupForUpdate?: boolean;
}) {
  const repository = repositoryOverride ?? workspaceRepository;
  const [locale, setLocale] = useState<Locale>("es");
  const [configuration, setConfiguration] = useState<WorkspaceConfiguration>(
    () => createDefaultWorkspaceConfiguration(),
  );
  const [route, setRouteState] = useState<RouteKey>(() => routeFromHash());
  const restoredContextHash = useRef<string | undefined>(undefined);
  const setRoute = (nextRoute: RouteKey, recordId?: string): void => {
    setRouteState(nextRoute);
    if (globalThis.location && globalThis.location.hash !== routeHash(nextRoute, recordId)) globalThis.location.hash = routeHash(nextRoute, recordId);
  };
  useEffect(() => {
    const synchronizeRoute = () => setRouteState(routeFromHash());
    if (globalThis.location && !globalThis.location.hash) globalThis.history.replaceState(undefined, '', routeHash('dashboard'));
    globalThis.addEventListener('hashchange', synchronizeRoute);
    return () => globalThis.removeEventListener('hashchange', synchronizeRoute);
  }, []);
  const [leads, setLeads] = useState<readonly Lead[]>([]);
  const [clients, setClients] = useState<readonly Client[]>([]);
  const [trips, setTrips] = useState<readonly Trip[]>([]);
  const [providers, setProviders] = useState<readonly Provider[]>([]);
  const [commissions, setCommissions] = useState<readonly Commission[]>([]);
  const [commissionToPay, setCommissionToPay] = useState<
    Commission | undefined
  >();
  const [selectedCommission, setSelectedCommission] = useState<
    Commission | undefined
  >();
  const [isCommissionWorkspace, setIsCommissionWorkspace] = useState(false);
  const [editingProvider, setEditingProvider] = useState<
    Provider | undefined
  >();
  const [showProviderDetail, setShowProviderDetail] = useState(false);
  const [isProviderWorkspace, setIsProviderWorkspace] = useState(false);
  const [editingProviderTemplates, setEditingProviderTemplates] = useState<
    readonly import("../domain/types").ProviderTaskTemplate[]
  >([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [isLeadWorkspace, setIsLeadWorkspace] = useState(false);
  const [isClientWorkspace, setIsClientWorkspace] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<
    readonly ActivityEvent[]
  >([]);
  const [selectedTasks, setSelectedTasks] = useState<readonly Task[]>([]);
  const [allTasks, setAllTasks] = useState<readonly Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isTaskWorkspace, setIsTaskWorkspace] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>();
  const [isTripWorkspace, setIsTripWorkspace] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isServiceWorkspace, setIsServiceWorkspace] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | undefined>();
  const [isPaymentWorkspace, setIsPaymentWorkspace] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [creatingClient, setCreatingClient] = useState(false);
  const [undoArchiveToast, setUndoArchiveToast] = useState<
    UndoArchiveToast | undefined
  >();
  const [selectedClientEvents, setSelectedClientEvents] = useState<
    readonly ActivityEvent[]
  >([]);
  const [selectedTripServices, setSelectedTripServices] = useState<
    readonly Service[]
  >([]);
  const [selectedTripAdditionalItems, setSelectedTripAdditionalItems] = useState<
    readonly ServiceAdditionalItem[]
  >([]);
  const [selectedTripNotes, setSelectedTripNotes] = useState<
    readonly RichNote[]
  >([]);
  const [selectedTripEvents, setSelectedTripEvents] = useState<
    readonly ActivityEvent[]
  >([]);
  const [selectedPaymentComponents, setSelectedPaymentComponents] = useState<
    readonly CustomerPaymentComponent[]
  >([]);
  const [selectedTripPayments, setSelectedTripPayments] = useState<
    readonly Payment[]
  >([]);
  const [calendarServices, setCalendarServices] = useState<readonly Service[]>(
    [],
  );
  const [calendarServiceProviders, setCalendarServiceProviders] = useState<
    readonly ServiceProvider[]
  >([]);
  const [backupDownloads, setBackupDownloads] = useState<
    readonly BackupDownload[]
  >([]);
  const [workspaceNotes, setWorkspaceNotes] = useState<readonly RichNote[]>([]);
  const activeLabel = (key: RouteKey) => t(key as TranslationKey, locale);

  useEffect(() => {
    const loadWorkspace = async () => {
      const timestamp = new Date().toISOString();
      await reconcileWorkspaceOperation(repository, {
        today: timestamp.slice(0, 10),
        commissionFollowUpTitle: t("commissionFollowUpTask", "es"),
        occurredAt: timestamp,
        recordedAt: timestamp,
      });
      const [
        allLeads,
        allClients,
        allTrips,
        allProviders,
        allCommissions,
        workspaceTasks,
        downloads,
        storedConfiguration,
        snapshot,
      ] = await Promise.all([
        repository.listLeads(),
        repository.listClients(),
        repository.listTrips(),
        repository.listProviders(),
        repository.listCommissions(),
        repository.listTasks(),
        repository.listBackupDownloads(),
        repository.getConfiguration(),
        repository.snapshot(),
      ]);
      setLeads(allLeads);
      setClients(allClients);
      setTrips(allTrips);
      setProviders(allProviders);
      setCommissions(allCommissions);
      setAllTasks(workspaceTasks);
      setBackupDownloads(downloads);
      setConfiguration(storedConfiguration);
      setLocale(storedConfiguration.locale);
      setWorkspaceNotes(snapshot.notes);
    };
    void loadWorkspace();
  }, [repository]);
  // The hash is an external navigation source; rerunning only on loaded records
  // prevents reopening a workspace after every local detail refresh.
  useEffect(() => {
    const target = routeTargetFromHash();
    const contextKey = target ? `${route}:${target}` : undefined;
    if (!contextKey || restoredContextHash.current === contextKey) return;
    const timeout = window.setTimeout(() => {
      if (route === 'leads') {
        const lead = leads.find((item) => item.id === target);
        if (lead) {
          restoredContextHash.current = contextKey;
          setSelectedLead(lead);
        }
      } else if (route === 'clients') {
        const client = clients.find((item) => item.id === target);
        if (client) {
          restoredContextHash.current = contextKey;
          openClient(client);
        }
      } else if (route === 'trips') {
        const trip = trips.find((item) => item.id === target);
        if (trip) {
          restoredContextHash.current = contextKey;
          void openTrip(trip);
        }
      } else if (route === 'providers') {
        const provider = providers.find((item) => item.id === target);
        if (provider) {
          restoredContextHash.current = contextKey;
          setEditingProvider(provider);
          setShowProviderDetail(true);
          void repository.listProviderTaskTemplates(provider.id).then(setEditingProviderTemplates);
        }
      } else if (route === 'tasks') {
        const task = allTasks.find((item) => item.id === target);
        if (task) {
          restoredContextHash.current = contextKey;
          setSelectedTask(task);
        }
      } else if (route === 'commissions') {
        const commission = commissions.find((item) => item.id === target);
        if (commission) {
          restoredContextHash.current = contextKey;
          setSelectedCommission(commission);
        }
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  // Functions invoked above are intentionally excluded: their identities change
  // per render while the contextual hash must be consumed only once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, clients, commissions, leads, providers, repository, route, trips]);
  useEffect(() => {
    void Promise.all(
      trips.map((trip) => repository.listServicesForTrip(trip.id)),
    ).then(async (serviceGroups) => {
      const services = serviceGroups.flat();
      const componentGroups = await Promise.all(
        services.map((service) =>
          repository.listServiceProvidersForService(service.id),
        ),
      );
      setCalendarServices(services);
      setCalendarServiceProviders(componentGroups.flat());
    });
  }, [repository, trips]);
  useEffect(() => {
    if (!selectedLead) return;
    void Promise.all([
      repository.listEventsForAggregate(selectedLead.id),
      repository.listTasksForLead(selectedLead.id),
    ]).then(([events, tasks]) => {
      setSelectedEvents(events);
      setSelectedTasks(tasks);
    });
  }, [repository, selectedLead]);
  useEffect(() => {
    if (!undoArchiveToast) return;
    const timeoutId = window.setTimeout(
      () => setUndoArchiveToast(undefined),
      5000,
    );
    return () => window.clearTimeout(timeoutId);
  }, [undoArchiveToast]);

  async function saveConfiguration(
    nextConfiguration: WorkspaceConfiguration,
  ): Promise<void> {
    await repository.saveConfiguration(nextConfiguration);
    setConfiguration(nextConfiguration);
    setLocale(nextConfiguration.locale);
  }

  async function createCancellationReason(label: string): Promise<CatalogEntry> {
    const normalized = label.trim();
    const existing = configuration.catalogs.cancellationReasons.find((entry) => entry.label.localeCompare(normalized, undefined, { sensitivity: "accent" }) === 0);
    if (existing) return existing;
    const entry: CatalogEntry = {
      id: `cancellation-reason-${crypto.randomUUID()}`,
      label: normalized,
      active: true,
    };
    await saveConfiguration({
      ...configuration,
      catalogs: {
        ...configuration.catalogs,
        cancellationReasons: [...configuration.catalogs.cancellationReasons, entry],
      },
      updatedAt: new Date().toISOString(),
    });
    return entry;
  }

  async function saveLead(value: LeadFormValue) {
    const timestamp = new Date().toISOString();
    if (editingLead) {
      const result = await updateLeadOperation(repository, {
        leadId: editingLead.id,
        draft: {
          name: value.name,
          acquisitionSource: value.acquisitionSource,
          communicationChannel: value.communicationChannel,
          requestedDateStatus: value.requestedDateStatus,
          requestedStartOn: value.requestedStartOn,
          requestedEndOn: value.requestedEndOn,
          adults: value.adults,
          children: value.children,
          commercialNote: value.commercialNote,
          referredBy: value.referredBy,
          residenceCountry: value.residenceCountry,
          phone: value.phone,
          email: value.email,
          destination: value.destination,
          travelType: value.travelType,
          ...(value.budgetAmount === undefined || !value.budgetCurrency
            ? {}
            : {
                budget: {
                  amount: value.budgetAmount,
                  currency: value.budgetCurrency,
                },
              }),
        },
        occurredAt: timestamp,
        recordedAt: timestamp,
      });
      setLeads((current) =>
        current.map((lead) =>
          lead.id === result.lead.id ? result.lead : lead,
        ),
      );
      setEditingLead(undefined);
      setShowLeadForm(false);
      return;
    }
    const result = await createLeadOperation(repository, {
      draft: {
        name: value.name,
        acquisitionSource: value.acquisitionSource,
        communicationChannel: value.communicationChannel,
        requestedDateStatus: value.requestedDateStatus,
        requestedStartOn: value.requestedStartOn,
        requestedEndOn: value.requestedEndOn,
        adults: value.adults,
        children: value.children,
        commercialNote: value.commercialNote,
        initialStatus: "contacted",
        referredBy: value.referredBy,
        residenceCountry: value.residenceCountry,
        phone: value.phone,
        email: value.email,
        destination: value.destination,
        travelType: value.travelType,
        ...(value.budgetAmount === undefined || !value.budgetCurrency
          ? {}
          : {
              budget: {
                amount: value.budgetAmount,
                currency: value.budgetCurrency,
              },
            }),
      },
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setLeads((current) => [result.lead, ...current]);
    setEditingLead(undefined);
    setShowLeadForm(false);
  }

  async function saveClient(value: ClientFormValue): Promise<void> {
    const timestamp = new Date().toISOString();
    if (!editingClient) {
      const result = await createClientOperation(repository, {
        draft: value,
        occurredAt: timestamp,
        recordedAt: timestamp,
      });
      setClients((current) => [result.client, ...current]);
      setCreatingClient(false);
      setSelectedClient(result.client);
      return;
    }
    const result = await updateClientOperation(repository, {
      clientId: editingClient.id,
      draft: value,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setClients((current) =>
      current.map((client) =>
        client.id === result.client.id ? result.client : client,
      ),
    );
    setEditingClient(undefined);
    setCreatingClient(false);
    setSelectedClient(result.client);
  }

  function editClient(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): void {
    if (target.kind !== "client") return;
    const client = clients.find((item) => item.id === target.id);
    if (!client) return;
    setEditingClient(client);
    setSelectedClient(undefined);
    setIsClientWorkspace(false);
  }

  async function archiveClient(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await archiveRecordOperation(repository, {
      ...target,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setClients(await repository.listClients());
    setSelectedClient(undefined);
    setIsClientWorkspace(false);
    setUndoArchiveToast({
      kind: "client",
      id: target.id,
      message: t("recordArchived", locale, {
        record: t("clientRecord", locale),
      }),
    });
  }

  async function restoreClient(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await restoreRecordOperation(repository, {
      ...target,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setClients(await repository.listClients());
  }

  async function deleteClient(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    await deleteRecordOperation(repository, target);
    setClients(await repository.listClients());
    setSelectedClient(undefined);
    setIsClientWorkspace(false);
  }

  async function loadRecordImpact(
    target: import("../application/recordImpact").ManagedRecordRef,
  ) {
    return repository.transact((transaction) =>
      transaction.getRecordImpact(target),
    );
  }

  async function archiveManagedRecord(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await archiveRecordOperation(repository, {
      ...target,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    if (target.kind === "lead") {
      setLeads(await repository.listLeads());
      setSelectedLead(undefined);
      setIsLeadWorkspace(false);
      setUndoArchiveToast({
        kind: "lead",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("leadRecord", locale),
        }),
      });
    }
    if (target.kind === "provider") {
      setProviders(await repository.listProviders());
      setEditingProvider(undefined);
      setShowProviderDetail(false);
      setIsProviderWorkspace(false);
      setUndoArchiveToast({
        kind: "provider",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("providerRecord", locale),
        }),
      });
    }
    if (target.kind === "trip") {
      setTrips(await repository.listTrips());
      setSelectedTrip(undefined);
      setIsTripWorkspace(false);
      setUndoArchiveToast({
        kind: "trip",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("tripRecord", locale),
        }),
      });
    }
    if (target.kind === "task") {
      const tasks = await repository.listTasks();
      setAllTasks(tasks);
      setSelectedTask(tasks.find((task) => task.id === target.id));
      setUndoArchiveToast({
        kind: "task",
        id: target.id,
        message: t("recordArchived", locale, { record: t("task", locale) }),
      });
    }
    if (target.kind === "commission") {
      const nextCommissions = await repository.listCommissions();
      setCommissions(nextCommissions);
      setSelectedCommission(
        nextCommissions.find((commission) => commission.id === target.id),
      );
      setUndoArchiveToast({
        kind: "commission",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("commissionRecord", locale),
        }),
      });
    }
    if (target.kind === "service" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedService(
        (await repository.listServicesForTrip(selectedTrip.id)).find(
          (service) => service.id === target.id,
        ),
      );
      setUndoArchiveToast({
        kind: "service",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("serviceRecord", locale),
        }),
      });
    }
    if (target.kind === "payment" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedPayment(
        (await repository.listPaymentsForTrip(selectedTrip.id)).find(
          (payment) => payment.id === target.id,
        ),
      );
      setUndoArchiveToast({
        kind: "payment",
        id: target.id,
        message: t("recordArchived", locale, {
          record: t("paymentRecord", locale),
        }),
      });
    }
  }

  async function undoArchive(): Promise<void> {
    if (!undoArchiveToast) return;
    const target = undoArchiveToast;
    const timestamp = new Date().toISOString();
    await restoreRecordOperation(repository, {
      kind: target.kind,
      id: target.id,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    if (target.kind === "lead") setLeads(await repository.listLeads());
    else if (target.kind === "client")
      setClients(await repository.listClients());
    else if (target.kind === "provider")
      setProviders(await repository.listProviders());
    else if (target.kind === "trip") setTrips(await repository.listTrips());
    else if (target.kind === "task") {
      const tasks = await repository.listTasks();
      setAllTasks(tasks);
      setSelectedTask(tasks.find((task) => task.id === target.id));
    } else if (target.kind === "commission") {
      const nextCommissions = await repository.listCommissions();
      setCommissions(nextCommissions);
      setSelectedCommission(
        nextCommissions.find((commission) => commission.id === target.id),
      );
    } else if (target.kind === "service" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedService(
        (await repository.listServicesForTrip(selectedTrip.id)).find(
          (service) => service.id === target.id,
        ),
      );
    } else if (target.kind === "payment" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedPayment(
        (await repository.listPaymentsForTrip(selectedTrip.id)).find(
          (payment) => payment.id === target.id,
        ),
      );
    }
    setUndoArchiveToast(undefined);
  }

  async function restoreManagedRecord(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await restoreRecordOperation(repository, {
      ...target,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    if (target.kind === "lead") setLeads(await repository.listLeads());
    if (target.kind === "provider")
      setProviders(await repository.listProviders());
    if (target.kind === "trip") setTrips(await repository.listTrips());
    if (target.kind === "task") {
      const tasks = await repository.listTasks();
      setAllTasks(tasks);
      setSelectedTask(tasks.find((task) => task.id === target.id));
    }
    if (target.kind === "commission") {
      const nextCommissions = await repository.listCommissions();
      setCommissions(nextCommissions);
      setSelectedCommission(
        nextCommissions.find((commission) => commission.id === target.id),
      );
    }
    if (target.kind === "service" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedService(
        (await repository.listServicesForTrip(selectedTrip.id)).find(
          (service) => service.id === target.id,
        ),
      );
    }
    if (target.kind === "payment" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      setSelectedPayment(
        (await repository.listPaymentsForTrip(selectedTrip.id)).find(
          (payment) => payment.id === target.id,
        ),
      );
    }
  }

  async function deleteManagedRecord(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): Promise<void> {
    await deleteRecordOperation(repository, target);
    if (target.kind === "lead") {
      setLeads(await repository.listLeads());
      setSelectedLead(undefined);
      setIsLeadWorkspace(false);
    }
    if (target.kind === "provider") {
      setProviders(await repository.listProviders());
      setEditingProvider(undefined);
      setShowProviderDetail(false);
      setIsProviderWorkspace(false);
    }
    if (target.kind === "trip") {
      setTrips(await repository.listTrips());
      setSelectedTrip(undefined);
      setIsTripWorkspace(false);
    }
    if (target.kind === "task") {
      setAllTasks(await repository.listTasks());
      if (selectedTask?.id === target.id) {
        setSelectedTask(undefined);
        setIsTaskWorkspace(false);
      }
    }
    if (target.kind === "commission") {
      setCommissions(await repository.listCommissions());
      if (selectedCommission?.id === target.id) {
        setSelectedCommission(undefined);
        setIsCommissionWorkspace(false);
      }
    }
    if (target.kind === "service" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      if (selectedService?.id === target.id) {
        setSelectedService(undefined);
        setIsServiceWorkspace(false);
      }
    }
    if (target.kind === "payment" && selectedTrip) {
      await loadTripWorkspace(selectedTrip);
      if (selectedPayment?.id === target.id) {
        setSelectedPayment(undefined);
        setIsPaymentWorkspace(false);
      }
    }
  }

  function editLead(
    target: import("../application/recordImpact").ManagedRecordRef,
  ): void {
    if (target.kind !== "lead") return;
    const lead = leads.find((item) => item.id === target.id);
    if (!lead) return;
    setEditingLead(lead);
    setSelectedLead(undefined);
    setIsLeadWorkspace(false);
    setShowLeadForm(true);
  }

  async function transitionSelectedLead(
    to: LeadStatus,
    payload?: { cancellationReasonId?: string; cancellationReasonNote?: string; createPausedFollowUp?: boolean },
  ) {
    if (!selectedLead) return;
    const timestamp = new Date().toISOString();
    const result = await transitionLeadOperation(repository, {
      leadId: selectedLead.id,
      to,
      occurredAt: timestamp,
      recordedAt: timestamp,
      suggestedTaskTitle: t("followUpQuoteTask", locale),
      pausedTaskTitle: t("resumePausedLeadTask", locale),
      payload,
      createPausedFollowUp: payload?.createPausedFollowUp,
    });
    setSelectedLead(result.lead);
    setLeads((current) =>
      current.map((lead) => (lead.id === result.lead.id ? result.lead : lead)),
    );
    setSelectedEvents((current) => [...current, result.event]);
    setSelectedTasks(await repository.listTasksForLead(result.lead.id));
  }

  async function convertSelectedLead(payment: {
    amount: number;
    currency: "USD" | "MXN";
    clientId?: string;
    primaryMemberId?: string;
  }) {
    if (!selectedLead) return;
    const timestamp = new Date().toISOString();
    const result = await convertLeadOperation(repository, {
      leadId: selectedLead.id,
      clientId: payment.clientId,
      primaryMemberId: payment.primaryMemberId,
      firstPayment: payment,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setClients(await repository.listClients());
    setTrips(await repository.listTrips());
    const soldLead = await repository.getLead(selectedLead.id);
    if (soldLead) {
      setSelectedLead(soldLead);
      setLeads((current) =>
        current.map((lead) => (lead.id === soldLead.id ? soldLead : lead)),
      );
      setSelectedEvents((current) => [...current, ...result.events]);
    }
  }

  async function completeSelectedTask(taskId: string) {
    if (!selectedLead) return;
    const timestamp = new Date().toISOString();
    await completeTaskOperation(repository, {
      taskId,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setSelectedTasks(await repository.listTasksForLead(selectedLead.id));
    setAllTasks(await repository.listTasks());
  }

  async function createWorkspaceTask(value: TaskFormValue): Promise<void> {
    const timestamp = new Date().toISOString();
    await createManualTaskOperation(repository, { ...value, occurredAt: timestamp, recordedAt: timestamp });
    setAllTasks(await repository.listTasks());
  }

  async function updateWorkspaceTask(taskId: string, value: TaskFormValue): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateManualTaskOperation(repository, { taskId, ...value, occurredAt: timestamp, recordedAt: timestamp });
    const tasks = await repository.listTasks();
    setAllTasks(tasks);
    setSelectedTask(tasks.find((task) => task.id === taskId));
  }

  async function resolveTemplateTaskDateReview(taskId: string, decision: 'keep_manual' | 'recalculate'): Promise<void> {
    const timestamp = new Date().toISOString();
    await resolveTemplateTaskDateReviewOperation(repository, { taskId, decision, occurredAt: timestamp, recordedAt: timestamp });
    const tasks = await repository.listTasks();
    setAllTasks(tasks);
    setSelectedTask(tasks.find((task) => task.id === taskId));
  }

  async function rescheduleSelectedTask(taskId: string, dueOn: string) {
    if (!selectedLead) return;
    const timestamp = new Date().toISOString();
    await rescheduleTaskOperation(repository, {
      taskId,
      dueOn,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setSelectedTasks(await repository.listTasksForLead(selectedLead.id));
    setAllTasks(await repository.listTasks());
  }

  async function completeWorkspaceTask(taskId: string): Promise<Task> {
    const timestamp = new Date().toISOString();
    const result = await completeTaskOperation(repository, {
      taskId,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const tasks = await repository.listTasks();
    setAllTasks(tasks);
    setSelectedTask(tasks.find((task) => task.id === taskId));
    return result.task;
  }

  async function reopenWorkspaceTask(taskId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await reopenTaskOperation(repository, {
      taskId,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const tasks = await repository.listTasks();
    setAllTasks(tasks);
    setSelectedTask(tasks.find((task) => task.id === taskId));
  }

  async function rescheduleWorkspaceTask(
    taskId: string,
    dueOn: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await rescheduleTaskOperation(repository, {
      taskId,
      dueOn,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const tasks = await repository.listTasks();
    setAllTasks(tasks);
    setSelectedTask(tasks.find((task) => task.id === taskId));
  }

  async function markCommissionPaid(
    commission: Commission,
    received: { amount: number; currency: "USD" | "MXN" },
    confirmDifference: boolean,
    paidOn: string,
    note?: string,
  ) {
    const timestamp = new Date().toISOString();
    await markCommissionPaidOperation(repository, {
      commissionId: commission.id,
      paidOn,
      received,
      confirmDifference,
      note,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const nextCommissions = await repository.listCommissions();
    setCommissions(nextCommissions);
    setSelectedCommission(
      nextCommissions.find((item) => item.id === commission.id),
    );
    setCommissionToPay(undefined);
  }

  async function updateCommissionTracking(
    commissionId: string,
    trackingReference: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateCommissionTrackingOperation(repository, {
      commissionId,
      trackingReference,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const nextCommissions = await repository.listCommissions();
    setCommissions(nextCommissions);
    setSelectedCommission(
      nextCommissions.find((item) => item.id === commissionId),
    );
  }

  async function updateCommissionProjectionRate(
    input: Readonly<{ commissionId: string; mode: 'override'; baseCurrency: Currency; quoteCurrency: Currency; exchangeRate: number }> | Readonly<{ commissionId: string; mode: 'follow_trip' }>,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateCommissionProjectionRateOperation(repository, {
      ...input,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    const nextCommissions = await repository.listCommissions();
    setCommissions(nextCommissions);
    setSelectedCommission(nextCommissions.find((item) => item.id === input.commissionId));
  }

  async function cancelSelectedTrip(tripId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const nextTrip = await cancelTripOperation(repository, { tripId, occurredAt: timestamp, recordedAt: timestamp });
    setTrips(await repository.listTrips());
    await loadTripWorkspace(nextTrip);
  }

  async function loadTripWorkspace(trip: Trip): Promise<void> {
    const [services, notes, payments, allProviders, tripEvents, leadEvents] = await Promise.all([
      repository.listServicesForTrip(trip.id),
      repository.listNotesForOwner("trip", trip.id),
      repository.listPaymentsForTrip(trip.id),
      repository.listProviders(),
      repository.listEventsForAggregate(trip.id),
      repository.listEventsForAggregate(trip.leadId),
    ]);
    const componentGroups = await Promise.all(
      services.map((service) =>
        repository.listServiceProvidersForService(service.id),
      ),
    );
    const additionalItemGroups = await Promise.all(
      services.map((service) =>
        repository.listServiceAdditionalItemsForService(service.id),
      ),
    );
    const providerNameById = new Map(
      allProviders.map((provider) => [provider.id, provider.name]),
    );
    const paymentComponents = componentGroups.flatMap((components, index) =>
      components.map((component) => ({
        id: component.id,
        serviceName: services[index].name,
        providerName: providerNameById.get(component.providerId) ?? "Proveedor",
        currency: component.currency,
        saleAmount: component.saleAmount,
        reservationLocator: component.reservationLocator,
        customerBalanceDueOn: component.customerBalanceDueOn,
        commissionStatus: component.commissionStatus,
        cancellationOutcome: component.cancellationOutcome,
        cancelledAt: component.cancelledAt,
        archived: Boolean(services[index].archivedAt),
      })),
    );
    setSelectedTripServices(services);
    setSelectedTripAdditionalItems(additionalItemGroups.flat());
    setSelectedTripNotes(notes);
    setSelectedTripEvents([...tripEvents, ...leadEvents]);
    setSelectedPaymentComponents(paymentComponents);
    setSelectedTripPayments(payments);
  }

  async function enableComponentCommission(serviceProviderId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await enableCommissionForServiceProviderOperation(repository, { serviceProviderId, occurredAt: timestamp, recordedAt: timestamp });
    setCommissions(await repository.listCommissions());
    if (selectedTrip) await loadTripWorkspace(selectedTrip);
  }

  async function recordComponentCancellation(input: Readonly<{ serviceProviderId: string; cancellationOutcome: NonNullable<ServiceProvider['cancellationOutcome']>; commissionOutcome: 'cancel' | 'continue' }>): Promise<void> {
    const timestamp = new Date().toISOString();
    await recordServiceProviderCancellationOperation(repository, { ...input, occurredAt: timestamp, recordedAt: timestamp });
    setCommissions(await repository.listCommissions());
    if (selectedTrip) await loadTripWorkspace(selectedTrip);
  }

  async function openTrip(trip: Trip): Promise<void> {
    setSelectedTrip(trip);
    await loadTripWorkspace(trip);
  }

  async function saveTripWorkspace(draft: TripWorkspaceDraft): Promise<void> {
    const timestamp = new Date().toISOString();
    const result = await saveTripWorkspaceOperation(repository, {
      ...draft,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setClients(await repository.listClients());
    setTrips(await repository.listTrips());
    setSelectedTrip(result.trip);
    await loadTripWorkspace(result.trip);
  }

  async function saveSelectedService(
    value: Readonly<{ name: string; startOn?: string; endOn?: string }>,
  ): Promise<void> {
    if (!selectedTrip || !selectedService) return;
    const client = clients.find((item) => item.id === selectedTrip.clientId);
    if (!client) return;
    await saveTripWorkspace({
      client,
      trip: selectedTrip,
      services: selectedTripServices.map((service) =>
        service.id === selectedService.id ? { ...service, ...value } : service,
      ),
      notes: selectedTripNotes,
    });
    setSelectedService(
      (await repository.listServicesForTrip(selectedTrip.id)).find(
        (service) => service.id === selectedService.id,
      ),
    );
  }

  async function recordCustomerPayment(
    input: Readonly<{
      serviceProviderId: string;
      amount: Readonly<{ amount: number; currency: "USD" | "MXN" }>;
      occurredOn: string;
    }>,
  ): Promise<void> {
    if (!selectedTrip) return;
    const recordedAt = new Date().toISOString();
    await recordCustomerPaymentOperation(repository, {
      tripId: selectedTrip.id,
      serviceProviderId: input.serviceProviderId,
      amount: input.amount,
      occurredAt: `${input.occurredOn}T12:00:00.000Z`,
      recordedAt,
    });
    await loadTripWorkspace(selectedTrip);
  }

  async function correctCustomerPayment(
    input: Readonly<{
      paymentId: string;
      amount: Readonly<{ amount: number; currency: "USD" | "MXN" }>;
      occurredOn: string;
    }>,
  ): Promise<void> {
    if (!selectedTrip) return;
    const recordedAt = new Date().toISOString();
    await correctCustomerPaymentOperation(repository, {
      paymentId: input.paymentId,
      amount: input.amount,
      occurredAt: `${input.occurredOn}T12:00:00.000Z`,
      recordedAt,
    });
    await loadTripWorkspace(selectedTrip);
    setSelectedPayment(
      (await repository.listPaymentsForTrip(selectedTrip.id)).find(
        (payment) => payment.id === input.paymentId,
      ),
    );
  }

  async function saveProvider(value: ProviderFormValue): Promise<void> {
    const timestamp = new Date().toISOString();
    await saveProviderOperation(repository, {
      ...value,
      ...(editingProvider ? { id: editingProvider.id } : {}),
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setProviders(await repository.listProviders());
    setEditingProvider(undefined);
    setShowProviderDetail(false);
    setIsProviderWorkspace(false);
  }

  async function addProviderToService(
    value: ServiceProviderAssignmentValue,
  ): Promise<ProviderAssignmentResult> {
    const timestamp = new Date().toISOString();
    const result = await addProviderToServiceOperation(repository, {
      ...value,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    if (selectedTrip) await loadTripWorkspace(selectedTrip);
    setCommissions(await repository.listCommissions());
    return result;
  }

  async function createSuggestedTasks(
    serviceProviderId: string,
    tasks: readonly SuggestedProviderTaskValue[],
  ): Promise<void> {
    if (!selectedTrip) return;
    const timestamp = new Date().toISOString();
    await createSuggestedProviderTasksOperation(repository, {
      tripId: selectedTrip.id,
      serviceProviderId,
      selectedTemplates: tasks,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setAllTasks(await repository.listTasks());
  }

  async function reactivateProvider(providerId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await reactivateProviderOperation(repository, {
      providerId,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setProviders(await repository.listProviders());
  }

  async function saveProviderTemplate(
    value: ProviderTaskTemplateValue,
  ): Promise<void> {
    if (!editingProvider) return;
    const timestamp = new Date().toISOString();
    await saveProviderTaskTemplateOperation(repository, {
      ...value,
      providerId: editingProvider.id,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    setEditingProviderTemplates(
      await repository.listProviderTaskTemplates(editingProvider.id),
    );
  }

  async function assignInitialPayment(
    input: Readonly<{ paymentId: string; serviceProviderId: string }>,
  ): Promise<void> {
    if (!selectedTrip) return;
    const timestamp = new Date().toISOString();
    await assignInitialPaymentOperation(repository, {
      ...input,
      occurredAt: timestamp,
      recordedAt: timestamp,
    });
    await loadTripWorkspace(selectedTrip);
  }

  function openClient(client: Client): void {
    setSelectedClient(client);
    const aggregateIds = [
      ...trips
        .filter((trip) => trip.clientId === client.id)
        .map((trip) => trip.id),
      ...leads
        .filter((lead) => lead.clientId === client.id)
        .map((lead) => lead.id),
      client.id,
    ];
    void Promise.all(
      aggregateIds.map((aggregateId) =>
        repository.listEventsForAggregate(aggregateId),
      ),
    ).then((eventGroups) => setSelectedClientEvents(eventGroups.flat()));
  }

  function openSearchResult(result: SearchResult): void {
    if (result.kind === "client") {
      const client = clients.find((item) => item.id === result.id);
      if (client) {
        setRoute("clients", client.id);
        openClient(client);
      }
      return;
    }
    if (result.kind === "lead") {
      const lead = leads.find((item) => item.id === result.id);
      if (lead) {
        setRoute("leads", lead.id);
        setEditingLead(undefined);
        setShowLeadForm(false);
        setSelectedLead(lead);
      }
      return;
    }
    if (result.kind === "trip") {
      const trip = trips.find((item) => item.id === result.id);
      if (trip) {
        setRoute("trips", trip.id);
        void openTrip(trip);
      }
      return;
    }
    if (result.kind === "provider") {
      const provider = providers.find((item) => item.id === result.id);
      if (provider) {
        setRoute("providers", provider.id);
        setEditingProvider(provider);
        setShowProviderDetail(true);
        void repository
          .listProviderTaskTemplates(provider.id)
          .then(setEditingProviderTemplates);
      }
      return;
    }
    setRoute(result.kind === "task" ? "tasks" : "commissions", result.id);
  }

  function openNotification(notification: WorkspaceNotification): void {
    if (notification.kind === "payment") {
      const component = calendarServiceProviders.find((item) => item.id === notification.targetId);
      const service = component ? calendarServices.find((item) => item.id === component.serviceId) : undefined;
      const trip = service ? trips.find((item) => item.id === service.tripId) : undefined;
      if (trip) {
        setRoute("trips", trip.id);
        void openTrip(trip);
        return;
      }
    }
    setRoute(
      notification.kind === "task"
        ? "tasks"
        : notification.kind === "commission"
          ? "commissions"
          : "data",
      notification.kind === "backup" ? undefined : notification.targetId,
    );
  }

  const tripWorkspace = selectedTrip ? (
    <>
      {!isTripWorkspace && (
        <div className="trip-workspace-launch">
          <button
            className="secondary-button"
            onClick={() => setIsTripWorkspace(true)}
            type="button"
          >
            {t("openFullWorkspace", locale)}
          </button>
        </div>
      )}
      <Suspense
        fallback={
          <p className="muted-copy" role="status">
            {t("openingTripWorkspace", locale)}
          </p>
        }
      >
        <TripDetail
          client={
            clients.find((client) => client.id === selectedTrip.clientId) ?? {
              id: selectedTrip.clientId,
              name: "",
              createdAt: selectedTrip.createdAt,
            }
          }
          key={`${selectedTrip.id}:${selectedTrip.status}:${selectedTripServices.map((service) => `${service.id}-${service.archivedAt ?? ""}`).join("|")}:${selectedTripPayments.map((payment) => `${payment.id}-${payment.archivedAt ?? ""}`).join("|")}`}
          notes={selectedTripNotes}
          events={selectedTripEvents}
          serviceAdditionalItems={selectedTripAdditionalItems}
          onAddProvider={addProviderToService}
          onAssignInitialPayment={assignInitialPayment}
          onClose={() => {
            setSelectedTrip(undefined);
            setIsTripWorkspace(false);
          }}
          onCreateSuggestedTasks={createSuggestedTasks}
          onCancelTrip={cancelSelectedTrip}
          onEnableCommission={enableComponentCommission}
          onRecordComponentCancellation={recordComponentCancellation}
          onOpenPaymentWorkspace={(payment) => {
            setSelectedPayment(payment);
            setIsPaymentWorkspace(true);
          }}
          onOpenServiceWorkspace={(service) => {
            setSelectedService(service);
            setIsServiceWorkspace(true);
          }}
          onReactivateProvider={reactivateProvider}
          onCorrectPayment={correctCustomerPayment}
          onRecordPayment={recordCustomerPayment}
          onSave={saveTripWorkspace}
          paymentComponents={selectedPaymentComponents}
          payments={selectedTripPayments}
          tasks={allTasks.filter((task) => task.tripId === selectedTrip.id)}
          providers={providers}
          services={selectedTripServices}
          trip={selectedTrip}
          renderServiceActions={(service) => (
            <RecordActions
              archived={Boolean(service.archivedAt)}
              label={t("recordActionsService", locale, {
                name: service.name || t("unnamed", locale),
              })}
              loadImpact={loadRecordImpact}
              onArchive={(target) => {
                void archiveManagedRecord(target);
              }}
              onDelete={(target) => {
                void deleteManagedRecord(target);
              }}
              onRestore={(target) => {
                void restoreManagedRecord(target);
              }}
              target={{ kind: "service", id: service.id }}
            />
          )}
          renderPaymentActions={(payment) => (
            <RecordActions
              archived={Boolean(payment.archivedAt)}
              label={t("recordActionsPayment", locale, { id: payment.id })}
              loadImpact={loadRecordImpact}
              onArchive={(target) => {
                void archiveManagedRecord(target);
              }}
              onDelete={(target) => {
                void deleteManagedRecord(target);
              }}
              onRestore={(target) => {
                void restoreManagedRecord(target);
              }}
              target={{ kind: "payment", id: payment.id }}
            />
          )}
          recordActions={
            <RecordActions
              archived={Boolean(selectedTrip.archivedAt)}
              label={t("recordActionsTrip", locale, {
                name:
                  clients.find((client) => client.id === selectedTrip.clientId)
                    ?.name ?? t("unnamedClient", locale),
              })}
              loadImpact={loadRecordImpact}
              onArchive={(target) => {
                void archiveManagedRecord(target);
              }}
              onDelete={(target) => {
                void deleteManagedRecord(target);
              }}
              onRestore={(target) => {
                void restoreManagedRecord(target);
              }}
              target={{ kind: "trip", id: selectedTrip.id }}
            />
          }
        />
      </Suspense>
    </>
  ) : undefined;
  const providerDetail = showProviderDetail ? (
    <ProviderDetail
      key={editingProvider?.id ?? "new"}
      onClose={() => {
        setEditingProvider(undefined);
        setEditingProviderTemplates([]);
        setShowProviderDetail(false);
        setIsProviderWorkspace(false);
      }}
      onOpenWorkspace={
        editingProvider && !isProviderWorkspace
          ? () => setIsProviderWorkspace(true)
          : undefined
      }
      onSave={saveProvider}
      onSaveTemplate={saveProviderTemplate}
      provider={editingProvider}
      templates={editingProviderTemplates}
      recordActions={
        editingProvider ? (
          <RecordActions
            archived={Boolean(editingProvider.archivedAt)}
            label={t("recordActionsProvider", locale, {
              name: editingProvider.name || t("unnamed", locale),
            })}
            loadImpact={loadRecordImpact}
            onArchive={(target) => {
              void archiveManagedRecord(target);
            }}
            onDelete={(target) => {
              void deleteManagedRecord(target);
            }}
            onRestore={(target) => {
              void restoreManagedRecord(target);
            }}
            target={{ kind: "provider", id: editingProvider.id }}
          />
        ) : undefined
      }
    />
  ) : undefined;
  const taskWorkspace = selectedTask ? (
    <DetailWorkspace
      breadcrumb={[t("tasks", locale), selectedTask.title]}
      onClose={() => {
        setIsTaskWorkspace(false);
        setSelectedTask(undefined);
      }}
      title={selectedTask.title}
    >
      <TaskDetail
        onComplete={(taskId) => {
          void completeWorkspaceTask(taskId);
        }}
        onReopen={(taskId) => {
          void reopenWorkspaceTask(taskId);
        }}
        onReschedule={(taskId, dueOn) => {
          void rescheduleWorkspaceTask(taskId, dueOn);
        }}
        recordActions={
          <RecordActions
            archived={Boolean(selectedTask.archivedAt)}
            label={`${t("task", locale)}: ${selectedTask.title}`}
            loadImpact={loadRecordImpact}
            onArchive={(target) => {
              void archiveManagedRecord(target);
            }}
            onDelete={(target) => {
              void deleteManagedRecord(target);
            }}
            onRestore={(target) => {
              void restoreManagedRecord(target);
            }}
            target={{ kind: "task", id: selectedTask.id }}
          />
        }
        task={selectedTask}
      />
    </DetailWorkspace>
  ) : undefined;
  const serviceWorkspace =
    selectedService && selectedTrip ? (
      <DetailWorkspace
        breadcrumb={[
          t("trips", locale),
          clients.find((client) => client.id === selectedTrip.clientId)?.name ??
            t("trip", locale),
          selectedService.name,
        ]}
        onClose={() => {
          setIsServiceWorkspace(false);
          setSelectedService(undefined);
        }}
        title={selectedService.name}
      >
        <ServiceDetail
          onSave={saveSelectedService}
          recordActions={
            <RecordActions
              archived={Boolean(selectedService.archivedAt)}
              label={t("recordActionsService", locale, {
                name: selectedService.name,
              })}
              loadImpact={loadRecordImpact}
              onArchive={(target) => {
                void archiveManagedRecord(target);
              }}
              onDelete={(target) => {
                void deleteManagedRecord(target);
              }}
              onRestore={(target) => {
                void restoreManagedRecord(target);
              }}
              target={{ kind: "service", id: selectedService.id }}
            />
          }
          service={selectedService}
        />
      </DetailWorkspace>
    ) : undefined;
  const paymentWorkspace =
    selectedPayment && selectedTrip ? (
      <DetailWorkspace
        breadcrumb={[
          t("trips", locale),
          clients.find((client) => client.id === selectedTrip.clientId)?.name ??
            t("trip", locale),
          t("payment", locale),
        ]}
        onClose={() => {
          setIsPaymentWorkspace(false);
          setSelectedPayment(undefined);
        }}
        title={`${t("payment", locale)} ${selectedPayment.id}`}
      >
        <PaymentDetail
          onCorrect={correctCustomerPayment}
          payment={selectedPayment}
          recordActions={
            <RecordActions
              archived={Boolean(selectedPayment.archivedAt)}
              label={t("recordActionsPayment", locale, {
                id: selectedPayment.id,
              })}
              loadImpact={loadRecordImpact}
              onArchive={(target) => {
                void archiveManagedRecord(target);
              }}
              onDelete={(target) => {
                void deleteManagedRecord(target);
              }}
              onRestore={(target) => {
                void restoreManagedRecord(target);
              }}
              target={{ kind: "payment", id: selectedPayment.id }}
            />
          }
          serviceName={
            selectedPaymentComponents.find(
              (component) => component.id === selectedPayment.serviceProviderId,
            )?.serviceName
          }
        />
      </DetailWorkspace>
    ) : undefined;
  const commissionWorkspace = selectedCommission ? (
    <DetailWorkspace
      breadcrumb={[
        t("commissions", locale),
        providers.find(
          (provider) => provider.id === selectedCommission.providerId,
        )?.name ?? t("commission", locale),
      ]}
      onClose={() => {
        setIsCommissionWorkspace(false);
        setSelectedCommission(undefined);
      }}
      title={
        providers.find(
          (provider) => provider.id === selectedCommission.providerId,
        )?.name ?? t("commission", locale)
      }
    >
      <CommissionDetail
        commission={selectedCommission}
        onMarkPaid={setCommissionToPay}
        onOpenProvider={() => {
          const provider = providers.find(
            (item) => item.id === selectedCommission.providerId,
          );
          if (!provider) return;
          setSelectedCommission(undefined);
          setIsCommissionWorkspace(false);
          setRoute("providers");
          setEditingProvider(provider);
          setShowProviderDetail(true);
          void repository
            .listProviderTaskTemplates(provider.id)
            .then(setEditingProviderTemplates);
        }}
        onOpenTrip={() => {
          const trip = trips.find((item) => item.id === selectedCommission.tripId);
          if (!trip) return;
          setSelectedCommission(undefined);
          setIsCommissionWorkspace(false);
          setRoute("trips");
          void openTrip(trip);
        }}
        onUpdateProjectionRate={updateCommissionProjectionRate}
        onUpdateTracking={updateCommissionTracking}
        providerName={
          providers.find(
            (provider) => provider.id === selectedCommission.providerId,
          )?.name ?? t("noProvider", locale)
        }
        recordActions={
          <RecordActions
            archived={Boolean(selectedCommission.archivedAt)}
            label={t("recordActionsCommission", locale, {
              provider:
                providers.find(
                  (provider) => provider.id === selectedCommission.providerId,
                )?.name ?? t("noProvider", locale),
            })}
            loadImpact={loadRecordImpact}
            onArchive={(target) => {
              void archiveManagedRecord(target);
            }}
            onDelete={(target) => {
              void deleteManagedRecord(target);
            }}
            onRestore={(target) => {
              void restoreManagedRecord(target);
            }}
            target={{ kind: "commission", id: selectedCommission.id }}
          />
        }
      />
    </DetailWorkspace>
  ) : undefined;
  let page: ReactNode;
  if (route === "dashboard")
    page = (
      <Page title={activeLabel(route)}>
        <Dashboard
          backupDownloads={backupDownloads}
          commissions={commissions}
          leads={leads}
          onCompleteTask={(taskId) => {
            void completeWorkspaceTask(taskId);
          }}
          onOpenCommission={(commissionId) => {
            setSelectedCommission(commissions.find((commission) => commission.id === commissionId));
            setIsCommissionWorkspace(true);
            setRoute("commissions", commissionId);
          }}
          onOpenTask={(taskId) => {
            setSelectedTask(allTasks.find((task) => task.id === taskId));
            setIsTaskWorkspace(true);
            setRoute("tasks", taskId);
          }}
          onOpenTrip={(tripId) => {
            const trip = trips.find((item) => item.id === tripId);
            if (trip) {
              setRoute("trips", tripId);
              void openTrip(trip);
            }
          }}
          onRescheduleTask={(taskId, dueOn) => {
            void rescheduleWorkspaceTask(taskId, dueOn);
          }}
          serviceProviders={calendarServiceProviders}
          services={calendarServices}
          tasks={allTasks}
          today={new Date().toISOString().slice(0, 10)}
          trips={trips}
        />
      </Page>
    );
  else if (route === "calendar")
    page = (
      <Page title={activeLabel(route)}>
        <CalendarPage
          clients={clients}
          commissions={commissions}
          onOpenClient={(clientId) => {
            const client = clients.find((item) => item.id === clientId);
            if (client) {
              setRoute("clients");
              openClient(client);
            }
          }}
          onOpenCommission={(commissionId) => {
            setSelectedCommission(commissions.find((item) => item.id === commissionId));
            setRoute("commissions", commissionId);
          }}
          onOpenTask={(taskId) => {
            setSelectedTask(allTasks.find((item) => item.id === taskId));
            setRoute("tasks", taskId);
          }}
          onOpenTrip={(tripId) => {
            const trip = trips.find((item) => item.id === tripId);
            if (trip) {
              setRoute("trips");
              void openTrip(trip);
            }
          }}
          serviceProviders={calendarServiceProviders}
          services={calendarServices}
          tasks={allTasks}
          today={new Date().toISOString().slice(0, 10)}
          trips={trips}
        />
      </Page>
    );
  else if (route === "data")
    page = (
      <Page title={activeLabel(route)}>
        <Suspense
          fallback={
            <p className="muted-copy" role="status">
              {t("openingDataAndBackups", locale)}
            </p>
          }
        >
          <DataBackupsPage
            onBackupHistoryChanged={() => {
              void repository.listBackupDownloads().then(setBackupDownloads);
            }}
            onWorkspaceChanged={() => {
              void Promise.all([
                repository.listLeads(),
                repository.listClients(),
                repository.listTrips(),
                repository.listProviders(),
                repository.listCommissions(),
                repository.listTasks(),
              ]).then(
                ([
                  allLeads,
                  allClients,
                  allTrips,
                  allProviders,
                  allCommissions,
                  workspaceTasks,
                ]) => {
                  setLeads(allLeads);
                  setClients(allClients);
                  setTrips(allTrips);
                  setProviders(allProviders);
                  setCommissions(allCommissions);
                  setAllTasks(workspaceTasks);
                },
              );
            }}
            repository={repository}
          />
        </Suspense>
      </Page>
    );
  else if (route === "leads")
    page = (
      <>
        <div className="page-heading">
          <h1>{t("leads", locale)}</h1>
          <Button
            onClick={() => {
              setSelectedLead(undefined);
              setEditingLead(undefined);
              setShowLeadForm(true);
            }}
          >
            <Menu aria-hidden="true" size={18} />
            {t("newLead", locale)}
          </Button>
        </div>
        <div className={isLeadWorkspace ? "workspace-mode" : ""}>
          {isLeadWorkspace && selectedLead ? (
            <DetailWorkspace
              breadcrumb={[
                t("leads", locale),
                selectedLead.name || t("lead", locale),
              ]}
              onClose={() => setIsLeadWorkspace(false)}
              title={selectedLead.name || t("lead", locale)}
            >
              <LeadDetail
                cancellationReasons={configuration.catalogs.cancellationReasons}
                onCreateCancellationReason={createCancellationReason}
                clients={clients}
                events={selectedEvents}
                lead={selectedLead}
                onClose={() => {
                  setSelectedLead(undefined);
                  setIsLeadWorkspace(false);
                }}
                onConvert={(payment) => {
                  void convertSelectedLead(payment);
                }}
                onTransition={(to, payload) => {
                  void transitionSelectedLead(to, payload);
                }}
                onCompleteTask={(taskId) => {
                  void completeSelectedTask(taskId);
                }}
                onRescheduleTask={(taskId, dueOn) => {
                  void rescheduleSelectedTask(taskId, dueOn);
                }}
                tasks={selectedTasks}
                recordActions={
                  <RecordActions
                    archived={Boolean(selectedLead.archivedAt)}
                    label={t("recordActionsLead", locale, {
                      name: selectedLead.name || t("unnamed", locale),
                    })}
                    loadImpact={loadRecordImpact}
                    onArchive={(target) => {
                      void archiveManagedRecord(target);
                    }}
                    onDelete={(target) => {
                      void deleteManagedRecord(target);
                    }}
                    onEdit={editLead}
                    onRestore={(target) => {
                      void restoreManagedRecord(target);
                    }}
                    target={{ kind: "lead", id: selectedLead.id }}
                  />
                }
              />
            </DetailWorkspace>
          ) : selectedLead ? (
            <ResizableDetailPanel
              panel={
                <LeadDetail
                  cancellationReasons={configuration.catalogs.cancellationReasons}
                  onCreateCancellationReason={createCancellationReason}
                  clients={clients}
                  events={selectedEvents}
                  lead={selectedLead}
                  onClose={() => {
                    setSelectedLead(undefined);
                    setIsLeadWorkspace(false);
                  }}
                  onConvert={(payment) => {
                    void convertSelectedLead(payment);
                  }}
                  onTransition={(to, payload) => {
                    void transitionSelectedLead(to, payload);
                }}
                  onCompleteTask={(taskId) => {
                    void completeSelectedTask(taskId);
                  }}
                  onRescheduleTask={(taskId, dueOn) => {
                    void rescheduleSelectedTask(taskId, dueOn);
                  }}
                  tasks={selectedTasks}
                  onOpenWorkspace={() => setIsLeadWorkspace(true)}
                  recordActions={
                    <RecordActions
                      archived={Boolean(selectedLead.archivedAt)}
                      label={t("recordActionsLead", locale, {
                        name: selectedLead.name || t("unnamed", locale),
                      })}
                      loadImpact={loadRecordImpact}
                      onArchive={(target) => {
                        void archiveManagedRecord(target);
                      }}
                      onDelete={(target) => {
                        void deleteManagedRecord(target);
                      }}
                      onEdit={editLead}
                      onRestore={(target) => {
                        void restoreManagedRecord(target);
                      }}
                      target={{ kind: "lead", id: selectedLead.id }}
                    />
                  }
                />
              }
            >
              <LeadList
                acquisitionSources={configuration.catalogs.acquisitionSources
                  .filter((entry) => entry.active)
                  .map((entry) => entry.label)}
                communicationChannels={configuration.catalogs.communicationChannels
                  .filter((entry) => entry.active)
                  .map((entry) => entry.label)}
                editingLead={editingLead}
                leads={leads}
                locale={locale}
                showForm={showLeadForm}
                onCancel={() => {
                  setEditingLead(undefined);
                  setShowLeadForm(false);
                }}
                onSave={(value) => {
                  void saveLead(value);
                }}
                onSelect={(lead) => {
                  setEditingLead(undefined);
                  setShowLeadForm(false);
                  setSelectedLead(lead);
                }}
                travelTypes={configuration.catalogs.travelTypes
                  .filter((entry) => entry.active)
                  .map((entry) => entry.label)}
              />
            </ResizableDetailPanel>
          ) : (
            <LeadList
              acquisitionSources={configuration.catalogs.acquisitionSources
                .filter((entry) => entry.active)
                .map((entry) => entry.label)}
              communicationChannels={configuration.catalogs.communicationChannels
                .filter((entry) => entry.active)
                .map((entry) => entry.label)}
              editingLead={editingLead}
              leads={leads}
              locale={locale}
              showForm={showLeadForm}
              onCancel={() => {
                setEditingLead(undefined);
                setShowLeadForm(false);
              }}
              onSave={(value) => {
                void saveLead(value);
              }}
              onSelect={(lead) => {
                setEditingLead(undefined);
                setShowLeadForm(false);
                setSelectedLead(lead);
              }}
              travelTypes={configuration.catalogs.travelTypes
                .filter((entry) => entry.active)
                .map((entry) => entry.label)}
            />
          )}
        </div>
      </>
    );
  else if (route === "clients")
    page = (
      <Page title={activeLabel(route)}>
        <div className={isClientWorkspace ? "workspace-mode" : ""}>
          {isClientWorkspace && selectedClient ? (
            <DetailWorkspace
              breadcrumb={[
                t("clients", locale),
                selectedClient.name || t("client", locale),
              ]}
              onClose={() => setIsClientWorkspace(false)}
              title={selectedClient.name || t("client", locale)}
            >
              <ClientDetail
                client={selectedClient}
                events={selectedClientEvents}
                leads={leads.filter((lead) => lead.clientId === selectedClient.id)}
                onClose={() => {
                  setSelectedClient(undefined);
                  setIsClientWorkspace(false);
                }}
                onOpenTrip={(trip) => {
                  setSelectedClient(undefined);
                  setIsClientWorkspace(false);
                  void openTrip(trip);
                }}
                onOpenLead={(lead) => {
                  setSelectedClient(undefined);
                  setIsClientWorkspace(false);
                  setSelectedLead(lead);
                  setRoute("leads");
                }}
                recordActions={
                  <RecordActions
                    archived={Boolean(selectedClient.archivedAt)}
                    label={t("recordActionsClient", locale, {
                      name: selectedClient.name || t("unnamed", locale),
                    })}
                    loadImpact={loadRecordImpact}
                    onArchive={(target) => {
                      void archiveClient(target);
                    }}
                    onDelete={(target) => {
                      void deleteClient(target);
                    }}
                    onEdit={editClient}
                    onRestore={(target) => {
                      void restoreClient(target);
                    }}
                    target={{ kind: "client", id: selectedClient.id }}
                  />
                }
                trips={trips.filter(
                  (trip) => trip.clientId === selectedClient.id,
                )}
              />
            </DetailWorkspace>
          ) : editingClient || creatingClient ? (
            <ClientForm
              client={editingClient}
              onCancel={() => {
                setEditingClient(undefined);
                setCreatingClient(false);
              }}
              onSave={(value) => {
                void saveClient(value);
              }}
            />
          ) : selectedClient ? (
            <ResizableDetailPanel
              panel={
                <ClientDetail
                  client={selectedClient}
                  events={selectedClientEvents}
                  leads={leads.filter((lead) => lead.clientId === selectedClient.id)}
                  onClose={() => {
                    setSelectedClient(undefined);
                    setIsClientWorkspace(false);
                  }}
                  onOpenTrip={(trip) => {
                    setSelectedClient(undefined);
                    setIsClientWorkspace(false);
                    void openTrip(trip);
                  }}
                  onOpenLead={(lead) => {
                    setSelectedClient(undefined);
                    setIsClientWorkspace(false);
                    setSelectedLead(lead);
                    setRoute("leads");
                  }}
                  onOpenWorkspace={() => setIsClientWorkspace(true)}
                  recordActions={
                    <RecordActions
                      archived={Boolean(selectedClient.archivedAt)}
                      label={t("recordActionsClient", locale, {
                        name: selectedClient.name || t("unnamed", locale),
                      })}
                      loadImpact={loadRecordImpact}
                      onArchive={(target) => {
                        void archiveClient(target);
                      }}
                      onDelete={(target) => {
                        void deleteClient(target);
                      }}
                      onEdit={editClient}
                      onRestore={(target) => {
                        void restoreClient(target);
                      }}
                      target={{ kind: "client", id: selectedClient.id }}
                    />
                  }
                  trips={trips.filter(
                    (trip) => trip.clientId === selectedClient.id,
                  )}
                />
              }
            >
              <ClientList
                clients={clients}
                onCreate={() => {
                  setSelectedClient(undefined);
                  setEditingClient(undefined);
                  setCreatingClient(true);
                }}
                onSelect={(client) => {
                  setEditingClient(undefined);
                  openClient(client);
                }}
              />
            </ResizableDetailPanel>
          ) : (
            <ClientList
              clients={clients}
              onCreate={() => {
                setSelectedClient(undefined);
                setEditingClient(undefined);
                setCreatingClient(true);
              }}
              onSelect={(client) => {
                setEditingClient(undefined);
                openClient(client);
              }}
            />
          )}
        </div>
      </Page>
    );
  else if (route === "trips")
    page = (
      <Page title={activeLabel(route)}>
        {isServiceWorkspace && serviceWorkspace ? (
          serviceWorkspace
        ) : isPaymentWorkspace && paymentWorkspace ? (
          paymentWorkspace
        ) : isTripWorkspace && selectedTrip ? (
          <DetailWorkspace
            breadcrumb={[
              t("trips", locale),
              clients.find((client) => client.id === selectedTrip.clientId)
                ?.name ?? t("trip", locale),
            ]}
            onClose={() => setIsTripWorkspace(false)}
            title={
              clients.find((client) => client.id === selectedTrip.clientId)
                ?.name ?? t("trip", locale)
            }
          >
            {tripWorkspace}
          </DetailWorkspace>
        ) : selectedTrip ? (
          <ResizableDetailPanel panel={tripWorkspace}>
            <TripList
              clients={clients}
              onSelect={(trip) => {
                void openTrip(trip);
              }}
              trips={trips}
            />
          </ResizableDetailPanel>
        ) : (
          <TripList
            clients={clients}
            onSelect={(trip) => {
              void openTrip(trip);
            }}
            trips={trips}
          />
        )}
      </Page>
    );
  else if (route === "providers")
    page = (
      <Page title={activeLabel(route)}>
        {isProviderWorkspace && editingProvider && providerDetail ? (
          <DetailWorkspace
            breadcrumb={[
              activeLabel(route),
              editingProvider.name || t("provider", locale),
            ]}
            onClose={() => setIsProviderWorkspace(false)}
            title={editingProvider.name || t("provider", locale)}
          >
            {providerDetail}
          </DetailWorkspace>
        ) : (
          <>
            <div className="page-heading">
              <h1>{activeLabel(route)}</h1>
              <Button
                onClick={() => {
                  setEditingProvider(undefined);
                  setEditingProviderTemplates([]);
                  setIsProviderWorkspace(false);
                  setShowProviderDetail(true);
                }}
              >
                {t("newProvider", locale)}
              </Button>
            </div>
            {showProviderDetail && providerDetail ? (
              <ResizableDetailPanel panel={providerDetail}>
                <ProviderList
                  onSelect={(provider) => {
                    setEditingProvider(provider);
                    setIsProviderWorkspace(false);
                    setShowProviderDetail(true);
                    void repository
                      .listProviderTaskTemplates(provider.id)
                      .then(setEditingProviderTemplates);
                  }}
              providers={providers}
                />
              </ResizableDetailPanel>
            ) : (
              <ProviderList
                onSelect={(provider) => {
                  setEditingProvider(provider);
                  setIsProviderWorkspace(false);
                  setShowProviderDetail(true);
                  void repository
                    .listProviderTaskTemplates(provider.id)
                    .then(setEditingProviderTemplates);
                }}
                providers={providers}
              />
            )}
          </>
        )}
      </Page>
    );
  else if (route === "tasks")
    page = (
      <Page title={activeLabel(route)}>
        {isTaskWorkspace && taskWorkspace ? (
          taskWorkspace
        ) : (
          <TaskBoard
            commissions={commissions}
            leads={leads}
            loadImpact={loadRecordImpact}
            onArchive={(target) => {
              void archiveManagedRecord(target);
            }}
            onComplete={completeWorkspaceTask}
            onCreate={(value) => { void createWorkspaceTask(value); }}
            onDelete={(target) => {
              void deleteManagedRecord(target);
            }}
            onEdit={(taskId, value) => { void updateWorkspaceTask(taskId, value); }}
            onOpenWorkspace={(task) => {
              setSelectedTask(task);
              setIsTaskWorkspace(true);
            }}
            onReopen={reopenWorkspaceTask}
            onResolveTemplateDateReview={(taskId, decision) => { void resolveTemplateTaskDateReview(taskId, decision); }}
            onRestore={(target) => {
              void restoreManagedRecord(target);
            }}
            onReschedule={(taskId, dueOn) => {
              void rescheduleWorkspaceTask(taskId, dueOn);
            }}
            tasks={allTasks}
            today={new Date().toISOString().slice(0, 10)}
            trips={trips}
            providers={providers}
            serviceProviders={calendarServiceProviders}
          />
        )}
      </Page>
    );
  else if (route === "commissions")
    page = (
      <Page title={activeLabel(route)}>
        {isCommissionWorkspace && commissionWorkspace ? (
          commissionWorkspace
        ) : (
          <CommissionBoard
            commissions={commissions}
            loadImpact={loadRecordImpact}
            onArchive={(target) => {
              void archiveManagedRecord(target);
            }}
            onDelete={(target) => {
              void deleteManagedRecord(target);
            }}
            onMarkPaid={setCommissionToPay}
            onOpenWorkspace={(commission) => {
              setSelectedCommission(commission);
              setIsCommissionWorkspace(true);
            }}
            onRestore={(target) => {
              void restoreManagedRecord(target);
            }}
            onUpdateTracking={updateCommissionTracking}
            providers={providers}
          />
        )}
        {commissionToPay && (
          <CommissionPaymentDialog
            commission={commissionToPay}
            onCancel={() => setCommissionToPay(undefined)}
            onConfirm={(received, confirmDifference, paidOn, note) => {
              void markCommissionPaid(
                commissionToPay,
                received,
                confirmDifference,
                paidOn,
                note,
              );
            }}
          />
        )}
      </Page>
    );
  else if (route === "settings")
    page = (
      <Page title={activeLabel(route)}>
        <SettingsPage
          configuration={configuration}
          onSave={saveConfiguration}
        />
      </Page>
    );
  else page = <Page title={activeLabel(route)} />;
  const notifications = buildWorkspaceNotifications({
    backupDownloads,
    commissions,
    serviceProviders: calendarServiceProviders,
    services: calendarServices,
    tasks: allTasks,
    today: new Date().toISOString().slice(0, 10),
  });
  const latestWorkspaceChangeAt = [
    configuration.updatedAt,
    ...leads.map((item) => item.createdAt),
    ...clients.map((item) => item.lastSavedAt ?? item.createdAt),
    ...trips.map((item) => item.lastSavedAt ?? item.createdAt),
    ...providers.map((item) => item.createdAt),
    ...commissions.map((item) => item.createdAt),
    ...allTasks.map((item) => item.createdAt),
    ...calendarServices.map((item) => item.createdAt),
    ...calendarServiceProviders.map((item) => item.createdAt),
  ].sort().at(-1) ?? configuration.updatedAt;
  const hasEligibleJsonBackup = hasCurrentJsonBackup(backupDownloads, workspaceSnapshotVersion, latestWorkspaceChangeAt);
  return (
    <LocaleProvider locale={locale}>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="wordmark">
            <img
              alt="World Memories Travel Agency"
              className="brand-logo-wide"
              src="./brand/world-memories-logo.svg"
            />
            <img
              alt=""
              aria-hidden="true"
              className="brand-logo-mark"
              src="./brand/world-memories-monogram.svg"
            />
          </div>
          <nav aria-label={t("mainNavigation", locale)}>
            <ul className="navigation-list">
              {routeKeys.map((key) => {
                const Icon = icons[key];
                const navigationLabel = activeLabel(key);
                return (
                  <li key={key}>
                    <button
                      aria-current={route === key ? "page" : undefined}
                      aria-label={navigationLabel}
                      className="nav-link"
                      onClick={() => setRoute(key)}
                      title={navigationLabel}
                    >
                      <Icon aria-hidden="true" size={21} />
                      <span>{navigationLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="sidebar-footer">
            World Memories CRM
            <br />
            {t("crmLocalFirst", locale)}
          </div>
        </aside>
        <main className="main-area">
          <header className="topbar">
            <div className="topbar-actions">
              <GlobalSearch
                clients={clients}
                commissions={commissions}
                leads={leads}
                notes={workspaceNotes}
                onSelect={openSearchResult}
                providers={providers}
                serviceProviders={calendarServiceProviders}
                services={calendarServices}
                tasks={allTasks}
                trips={trips}
              />
              <NotificationCenter
                notifications={notifications}
                onOpen={openNotification}
              />
              <label>
                <span className="sr-only">{t("language", locale)}</span>
                <select
                  aria-label={t("language", locale)}
                  className="locale-select"
                  value={locale}
                  onChange={(event) => {
                    const nextLocale = event.target.value as Locale;
                    void saveConfiguration({
                      ...configuration,
                      locale: nextLocale,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                >
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                </select>
              </label>
            </div>
          </header>
          {applyUpdate && (
            <section className="update-prompt" role="status">
              <span>{t("updateAvailable", locale)}</span>
              <button
                className="secondary-button"
                onClick={onDeferUpdate}
                type="button"
              >
                {t("later", locale)}
              </button>
              <button
                className="primary-button"
                disabled={requiresBackupForUpdate && !hasEligibleJsonBackup}
                onClick={() => {
                  void applyUpdate();
                }}
                type="button"
              >
                {t("updateNow", locale)}
              </button>
              {requiresBackupForUpdate && !hasEligibleJsonBackup && <span className="form-error">{t('updateBackupRequired', locale)}</span>}
            </section>
          )}
          <div className="content">{page}</div>
          {undoArchiveToast && (
            <ToastRegion
              actionLabel={t("undo", locale)}
              message={undoArchiveToast.message}
              onAction={() => {
                void undoArchive();
              }}
            />
          )}
        </main>
      </div>
    </LocaleProvider>
  );
}
