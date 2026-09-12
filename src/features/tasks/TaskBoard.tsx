import { useState } from "react";
import { t, useLocale } from "../../app/i18n";
import type {
  ManagedRecordRef,
  RecordDeleteOptions,
  RecordImpact,
} from "../../application/recordImpact";
import {
  ArchiveFilterChips,
  type ArchiveFilter,
} from "../../design/components/ArchiveFilterChips";
import { RecordActions } from "../records/RecordActions";
import type { DeletedRecordReference, Task } from "../../domain/types";
import { resolveRecordReference } from "../../domain/recordReference";
import { filterTasks, groupTasks, type TaskFilters } from "./taskBoardModel";
import { OperationalDateField } from "../../design/components/OperationalDateField";
import { formatOperationalDate } from "../../domain/operationalDate";
import { TaskForm, type TaskFormValue } from "./TaskForm";
import { FilterBar } from "../../design/components/FilterBar";
import { TaskRescheduleControl } from './TaskRescheduleControl';
import { ToastRegion } from "../../design/components/ToastRegion";

type TaskBoardProps = Readonly<{
  tasks: readonly Task[];
  today: string;
  leads?: readonly import("../../domain/types").Lead[];
  trips?: readonly import("../../domain/types").Trip[];
  clients?: readonly import("../../domain/types").Client[];
  deletedReferences?: readonly DeletedRecordReference[];
  commissions?: readonly import("../../domain/types").Commission[];
  providers?: readonly import("../../domain/types").Provider[];
  serviceProviders?: readonly import("../../domain/types").ServiceProvider[];
  onCreate?: (value: TaskFormValue) => void | Promise<void>;
  onEdit?: (taskId: string, value: TaskFormValue) => void | Promise<void>;
  onResolveTemplateDateReview?: (taskId: string, decision: 'keep_manual' | 'recalculate') => void;
  onComplete: (taskId: string) => void | Task | Promise<void | Task>;
  onReopen?: (taskId: string) => void | Promise<void>;
  onReschedule: (taskId: string, dueOn: string) => void | Promise<void>;
  onOpenWorkspace?: (task: Task) => void;
  loadImpact?: (target: ManagedRecordRef) => Promise<RecordImpact>;
  onArchive?: (target: ManagedRecordRef) => void | Promise<void>;
  onDelete?: (target: ManagedRecordRef, options: RecordDeleteOptions) => void | Promise<void>;
  onRestore?: (target: ManagedRecordRef) => void;
}>;

type TaskUndo = Readonly<{
  action: "complete" | "reopen";
  task: Task;
}>;

export function TaskBoard({
  tasks,
  today,
  leads = [],
  trips = [],
  clients = [],
  deletedReferences = [],
  commissions = [],
  providers = [],
  serviceProviders = [],
  onCreate,
  onEdit,
  onResolveTemplateDateReview,
  onComplete,
  onReopen,
  onReschedule,
  onOpenWorkspace,
  loadImpact,
  onArchive,
  onDelete,
  onRestore,
}: TaskBoardProps) {
  const locale = useLocale();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active");
  const [undoableTask, setUndoableTask] = useState<TaskUndo | undefined>();
  const [taskActionError, setTaskActionError] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [creatingTask, setCreatingTask] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({ status: "open" });
  const archiveVisibleTasks = tasks.filter(
    (task) =>
      archiveFilter === "all" ||
      (archiveFilter === "archived"
        ? Boolean(task.archivedAt)
        : !task.archivedAt),
  );
  const invalidDateRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  const visibleTasks = filterTasks({
    tasks: archiveVisibleTasks,
    serviceProviders,
    filters: invalidDateRange ? { ...filters, from: undefined, to: undefined } : filters,
  });
  const groups = groupTasks(visibleTasks, today);
  const completedTasks = visibleTasks.filter((task) => task.status === "completed");
  const sourceLabel = (task: Task) => task.source === "provider_template"
    ? t("templateTask", locale)
    : task.source === "lead_follow_up"
      ? t("leadFollowUpTask", locale)
      : task.source === "commission_follow_up"
        ? t("commissionFollowUpTask", locale)
        : t("manualTask", locale);
  const tripOptionLabel = (trip: import("../../domain/types").Trip): string => {
    const resolvedClient = resolveRecordReference(
      clients,
      deletedReferences,
      'client',
      trip.clientId,
    );
    const client = resolvedClient.state === 'live'
      ? resolvedClient.record.name
      : resolvedClient.state === 'deleted'
        ? t('deletedRecordReference', locale, { record: resolvedClient.reference.displayLabel })
        : t('unnamedClient', locale);
    const dates = trip.effectiveStartOn ? formatOperationalDate(trip.effectiveStartOn) : t('clientDatesToDefine', locale);
    return `${t('trip', locale)} · ${client} · ${dates}`;
  };
  const complete = async (task: Task) => {
    setTaskActionError(undefined);
    try {
      const completed = await Promise.resolve(onComplete(task.id));
      if (onReopen) {
        setUndoableTask({
          action: "complete",
          task: completed && "status" in completed
            ? completed
            : { ...task, status: "completed" },
        });
      }
    } catch {
      setTaskActionError(t("taskActionCouldNotBeCompleted", locale));
    }
  };
  const reopen = async (task: Task) => {
    if (!onReopen) return;
    setTaskActionError(undefined);
    try {
      await Promise.resolve(onReopen(task.id));
      setUndoableTask({
        action: "reopen",
        task: { ...task, completedAt: undefined, status: "open" },
      });
    } catch {
      setTaskActionError(t("taskActionCouldNotBeCompleted", locale));
    }
  };
  const undo = async () => {
    if (!undoableTask) return;
    setTaskActionError(undefined);
    try {
      if (undoableTask.action === "complete") {
        if (!onReopen) return;
        await Promise.resolve(onReopen(undoableTask.task.id));
      } else {
        await Promise.resolve(onComplete(undoableTask.task.id));
      }
      setUndoableTask(undefined);
    } catch {
      setTaskActionError(t("taskActionCouldNotBeCompleted", locale));
    }
  };
  const renderGroup = (title: string, items: readonly Task[]) => (
    <section className="task-group">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted-copy">{t("noTasks", locale)}</p>
      ) : (
        <ul className="task-list">
          {items.map((task) => (
            <li key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <small>
                  {task.dueOn
                    ? `${formatOperationalDate(task.dueOn)}${task.dueTime ? ` · ${task.dueTime}` : ""}`
                    : t("undated", locale)}
                </small>
                <small>{sourceLabel(task)}</small>
                {task.requiresManualDateReview && <small className="form-error">{t("manualDateReview", locale)}</small>}
              </div>
              <div className="task-actions">
                {!task.archivedAt && task.requiresManualDateReview && onResolveTemplateDateReview && <><button className="text-button" onClick={() => onResolveTemplateDateReview(task.id, 'keep_manual')} type="button">{t("keepManualDate", locale, { task: task.title })}</button><button className="text-button" onClick={() => onResolveTemplateDateReview(task.id, 'recalculate')} type="button">{t("recalculateTemplateDate", locale, { task: task.title })}</button></>}
                {onEdit && (
                  <button className="text-button" onClick={() => setEditingTask(task)} type="button">
                    {t("editTask", locale)}
                  </button>
                )}
                {onOpenWorkspace && (
                  <button
                    className="text-button"
                    onClick={() => onOpenWorkspace(task)}
                    type="button"
                  >
                    {t("openFullWorkspaceFor", locale, { record: task.title })}
                  </button>
                )}
                <TaskRescheduleControl onReschedule={onReschedule} task={task} />
                {!task.archivedAt && task.status === 'open' && <button
                  className="secondary-button"
                  onClick={() => { void complete(task); }}
                  type="button"
                >
                  {t("completeTask", locale, { task: task.title })}
                </button>}
                {!task.archivedAt && task.status === 'completed' && onReopen && <button className="secondary-button" onClick={() => { void reopen(task); }} type="button">{t("reopenTask", locale)}</button>}
                {loadImpact && onArchive && onDelete && (
                  <RecordActions
                    archived={Boolean(task.archivedAt)}
                    label={`${t("task", locale)}: ${task.title}`}
                    loadImpact={loadImpact}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    target={{ kind: "task", id: task.id }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
  return (
    <section aria-label={t("tasks", locale)}>
      {(creatingTask || editingTask) ? (
        <TaskForm
          commissions={commissions}
          clients={clients}
          deletedReferences={deletedReferences}
          leads={leads}
          onCancel={() => { setCreatingTask(false); setEditingTask(undefined); }}
          onSave={async (value) => { if (editingTask) await onEdit?.(editingTask.id, value); else await onCreate?.(value); setCreatingTask(false); setEditingTask(undefined); }}
          task={editingTask}
          trips={trips}
        />
      ) : <>
      {onCreate && <div className="page-actions"><button className="primary-button" onClick={() => setCreatingTask(true)} type="button">{t("newTask", locale)}</button></div>}
      <ArchiveFilterChips onChange={setArchiveFilter} value={archiveFilter} />
      <FilterBar label={t("taskFilters", locale)} onClear={() => setFilters({ status: 'open' })}>
      <div className="form-grid task-filters">
        <label>{t("taskStatus", locale)}<select aria-label={t("taskStatus", locale)} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TaskFilters["status"] }))} value={filters.status}><option value="all">{t("allTaskStatuses", locale)}</option><option value="open">{t("openTasks", locale)}</option><option value="completed">{t("completedTasks", locale)}</option></select></label>
        <label>{t("taskTrip", locale)}<select aria-label={t("taskTrip", locale)} onChange={(event) => setFilters((current) => ({ ...current, tripId: event.target.value || undefined }))} value={filters.tripId ?? ""}><option value="">{t("allTrips", locale)}</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{tripOptionLabel(trip)}</option>)}</select></label>
        <label>{t("taskProvider", locale)}<select aria-label={t("taskProvider", locale)} onChange={(event) => setFilters((current) => ({ ...current, providerId: event.target.value || undefined }))} value={filters.providerId ?? ""}><option value="">{t("allProviders", locale)}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
        <label>{t("fromDate", locale)}<OperationalDateField aria-label={t("fromDate", locale)} onChange={(from) => setFilters((current) => ({ ...current, from }))} value={filters.from} /></label>
        <label>{t("toDate", locale)}<OperationalDateField aria-label={t("toDate", locale)} onChange={(to) => setFilters((current) => ({ ...current, to }))} value={filters.to} /></label>
      </div>
      {invalidDateRange && <p className="form-error" role="alert">{t('invalidTaskDateRange', locale)}</p>}
      </FilterBar>
      {taskActionError && <p className="form-error" role="alert">{taskActionError}</p>}
      {undoableTask && <ToastRegion
        actionLabel={t("undoTask", locale, { task: undoableTask.task.title })}
        message={t(undoableTask.action === "complete" ? "taskCompleted" : "taskReopenedToast", locale, { task: undoableTask.task.title })}
        onAction={() => { void undo(); }}
        onDismiss={() => setUndoableTask(undefined)}
      />}
      {renderGroup(t("overdue", locale), groups.overdue)}
      {renderGroup(t("today", locale), groups.today)}
      {renderGroup(t("upcoming", locale), groups.upcoming)}
      {renderGroup(t("undated", locale), groups.undated)}
      {filters.status !== "open" && renderGroup(t("completedTasks", locale), completedTasks)}
      </>}
    </section>
  );
}
