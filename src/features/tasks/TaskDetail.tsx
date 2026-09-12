import { useState, type ReactNode } from "react";
import { t, useLocale } from "../../app/i18n";
import type { Task } from "../../domain/types";
import { formatOperationalDate } from "../../domain/operationalDate";
import { RecordHeader } from "../../design/components/RecordHeader";
import { TaskRescheduleControl } from './TaskRescheduleControl';
import { ToastRegion } from '../../design/components/ToastRegion';

type TaskDetailProps = Readonly<{
  onComplete: (taskId: string) => void | Promise<void>;
  onReopen: (taskId: string) => void | Promise<void>;
  onReschedule: (taskId: string, dueOn: string) => void | Promise<void>;
  recordActions?: ReactNode;
  task: Task;
}>;

export function TaskDetail({
  onComplete,
  onReopen,
  onReschedule,
  recordActions,
  task,
}: TaskDetailProps) {
  const locale = useLocale();
  const completed = task.status === "completed";
  const [undoAction, setUndoAction] = useState<"complete" | "reopen" | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const changeCompletion = async () => {
    setActionError(undefined);
    try {
      if (completed) {
        await Promise.resolve(onReopen(task.id));
        setUndoAction("reopen");
      } else {
        await Promise.resolve(onComplete(task.id));
        setUndoAction("complete");
      }
    } catch {
      setActionError(t("taskActionCouldNotBeCompleted", locale));
    }
  };
  const undo = async () => {
    if (!undoAction) return;
    setActionError(undefined);
    try {
      if (undoAction === "complete") await Promise.resolve(onReopen(task.id));
      else await Promise.resolve(onComplete(task.id));
      setUndoAction(undefined);
    } catch {
      setActionError(t("taskActionCouldNotBeCompleted", locale));
    }
  };
  return (
    <section aria-label={t("taskDetails", locale)} className="task-detail">
      <RecordHeader actions={recordActions} eyebrow={t("task", locale)} hideTitle title={task.title || t("taskDetails", locale)} />
      <dl className="detail-summary">
        <div>
          <dt>{t("status", locale)}</dt>
          <dd>{completed ? t("completed", locale) : t("taskOpen", locale)}</dd>
        </div>
        <div>
          <dt>{t("dueDate", locale, { date: "" }).replace(/: $/, "")}</dt>
          <dd>
            {task.dueOn
              ? formatOperationalDate(task.dueOn)
              : t("undated", locale)}
          </dd>
        </div>
      </dl>
      {!task.archivedAt && <>
        <TaskRescheduleControl onReschedule={onReschedule} task={task} />
        <div className="form-actions">
          <button
            className="primary-button"
            onClick={() => { void changeCompletion(); }}
            type="button"
          >
            {completed
              ? t("reopenTask", locale)
              : t("completeTask", locale, { task: task.title })}
          </button>
        </div>
      </>}
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      {undoAction && <ToastRegion
        actionLabel={t("undoTask", locale, { task: task.title })}
        message={t(undoAction === "complete" ? "taskCompleted" : "taskReopenedToast", locale, { task: task.title })}
        onAction={() => { void undo(); }}
        onDismiss={() => setUndoAction(undefined)}
      />}
    </section>
  );
}
