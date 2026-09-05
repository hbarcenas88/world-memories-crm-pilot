import { useState } from "react";
import { t, useLocale } from "../../app/i18n";
import type {
  ManagedRecordRef,
  RecordImpact,
} from "../../application/recordImpact";
import {
  ArchiveFilterChips,
  type ArchiveFilter,
} from "../../design/components/ArchiveFilterChips";
import { RecordActions } from "../records/RecordActions";
import type { Task } from "../../domain/types";
import { filterTasks, groupTasks, type TaskFilters } from "./taskBoardModel";
import { OperationalDateField } from "../../design/components/OperationalDateField";
import { formatOperationalDate } from "../../domain/operationalDate";
import { TaskForm, type TaskFormValue } from "./TaskForm";

type TaskBoardProps = Readonly<{
  tasks: readonly Task[];
  today: string;
  leads?: readonly import("../../domain/types").Lead[];
  trips?: readonly import("../../domain/types").Trip[];
  commissions?: readonly import("../../domain/types").Commission[];
  providers?: readonly import("../../domain/types").Provider[];
  serviceProviders?: readonly import("../../domain/types").ServiceProvider[];
  onCreate?: (value: TaskFormValue) => void;
  onEdit?: (taskId: string, value: TaskFormValue) => void;
  onResolveTemplateDateReview?: (taskId: string, decision: 'keep_manual' | 'recalculate') => void;
  onComplete: (taskId: string) => void | Task | Promise<void | Task>;
  onReopen?: (taskId: string) => void | Promise<void>;
  onReschedule: (taskId: string, dueOn: string) => void;
  onOpenWorkspace?: (task: Task) => void;
  loadImpact?: (target: ManagedRecordRef) => Promise<RecordImpact>;
  onArchive?: (target: ManagedRecordRef) => void;
  onDelete?: (target: ManagedRecordRef) => void;
  onRestore?: (target: ManagedRecordRef) => void;
}>;

export function TaskBoard({
  tasks,
  today,
  leads = [],
  trips = [],
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
  const [undoableTask, setUndoableTask] = useState<Task | undefined>();
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
  const visibleTasks = filterTasks({ tasks: archiveVisibleTasks, serviceProviders, filters });
  const groups = groupTasks(visibleTasks, today);
  const completedTasks = visibleTasks.filter((task) => task.status === "completed");
  const sourceLabel = (task: Task) => task.source === "provider_template"
    ? t("templateTask", locale)
    : task.source === "lead_follow_up"
      ? t("leadFollowUpTask", locale)
      : task.source === "commission_follow_up"
        ? t("commissionFollowUpTask", locale)
        : t("manualTask", locale);
  const complete = (task: Task) => {
    void Promise.resolve(onComplete(task.id)).then((completed) =>
      setUndoableTask(
        completed && "status" in completed
          ? completed
          : { ...task, status: "completed" },
      ),
    );
  };
  const reopen = () => {
    if (!undoableTask || !onReopen) return;
    void Promise.resolve(onReopen(undoableTask.id)).then(() =>
      setUndoableTask(undefined),
    );
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
                {task.requiresManualDateReview && onResolveTemplateDateReview && <><button className="text-button" onClick={() => onResolveTemplateDateReview(task.id, 'keep_manual')} type="button">{t("keepManualDate", locale, { task: task.title })}</button><button className="text-button" onClick={() => onResolveTemplateDateReview(task.id, 'recalculate')} type="button">{t("recalculateTemplateDate", locale, { task: task.title })}</button></>}
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
                <OperationalDateField
                  aria-label={t("newDateFor", locale, { task: task.title })}
                  onChange={(dueOn) => {
                    if (dueOn) onReschedule(task.id, dueOn);
                  }}
                  value={task.dueOn}
                />
                <button
                  className="secondary-button"
                  onClick={() => complete(task)}
                  type="button"
                >
                  {t("completeTask", locale, { task: task.title })}
                </button>
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
          leads={leads}
          onCancel={() => { setCreatingTask(false); setEditingTask(undefined); }}
          onSave={(value) => { if (editingTask) onEdit?.(editingTask.id, value); else onCreate?.(value); setCreatingTask(false); setEditingTask(undefined); }}
          task={editingTask}
          trips={trips}
        />
      ) : <>
      {onCreate && <div className="page-heading"><h2>{t("tasks", locale)}</h2><button className="primary-button" onClick={() => setCreatingTask(true)} type="button">{t("newTask", locale)}</button></div>}
      <ArchiveFilterChips onChange={setArchiveFilter} value={archiveFilter} />
      <fieldset className="form-grid task-filters">
        <legend>{t("taskFilters", locale)}</legend>
        <label>{t("taskStatus", locale)}<select aria-label={t("taskStatus", locale)} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TaskFilters["status"] }))} value={filters.status}><option value="all">{t("allTaskStatuses", locale)}</option><option value="open">{t("openTasks", locale)}</option><option value="completed">{t("completedTasks", locale)}</option></select></label>
        <label>{t("taskTrip", locale)}<select aria-label={t("taskTrip", locale)} onChange={(event) => setFilters((current) => ({ ...current, tripId: event.target.value || undefined }))} value={filters.tripId ?? ""}><option value="">{t("allTrips", locale)}</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.id}</option>)}</select></label>
        <label>{t("taskProvider", locale)}<select aria-label={t("taskProvider", locale)} onChange={(event) => setFilters((current) => ({ ...current, providerId: event.target.value || undefined }))} value={filters.providerId ?? ""}><option value="">{t("allProviders", locale)}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
        <label>{t("fromDate", locale)}<OperationalDateField aria-label={t("fromDate", locale)} onChange={(from) => setFilters((current) => ({ ...current, from }))} value={filters.from} /></label>
        <label>{t("toDate", locale)}<OperationalDateField aria-label={t("toDate", locale)} onChange={(to) => setFilters((current) => ({ ...current, to }))} value={filters.to} /></label>
      </fieldset>
      {undoableTask && onReopen && (
        <aside className="task-undo" aria-label={t("recentAction", locale)}>
          <span>
            {t("taskCompleted", locale, { task: undoableTask.title })}
          </span>
          <button className="text-button" onClick={reopen} type="button">
            {t("undoTask", locale, { task: undoableTask.title })}
          </button>
        </aside>
      )}
      {renderGroup(t("overdue", locale), groups.overdue)}
      {renderGroup(t("today", locale), groups.today)}
      {renderGroup(t("upcoming", locale), groups.upcoming)}
      {renderGroup(t("undated", locale), groups.undated)}
      {filters.status !== "open" && renderGroup(t("completedTasks", locale), completedTasks)}
      </>}
    </section>
  );
}
