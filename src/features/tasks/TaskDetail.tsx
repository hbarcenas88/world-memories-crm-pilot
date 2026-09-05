import type { ReactNode } from "react";
import { t, useLocale } from "../../app/i18n";
import type { Task } from "../../domain/types";
import { formatOperationalDate } from "../../domain/operationalDate";
import { OperationalDateField } from "../../design/components/OperationalDateField";

type TaskDetailProps = Readonly<{
  onComplete: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onReschedule: (taskId: string, dueOn: string) => void;
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
  return (
    <section aria-label={t("taskDetails", locale)} className="task-detail">
      <div className="detail-header">
        <div>
          <p className="detail-status">{t("task", locale)}</p>
          <h2>{t("taskDetails", locale)}</h2>
        </div>
        {recordActions}
      </div>
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
      {!completed && (
        <label>
          {t("newDateFor", locale, { task: task.title })}
          <OperationalDateField
            aria-label={t("newDateFor", locale, { task: task.title })}
            onChange={(dueOn) => {
              if (dueOn) onReschedule(task.id, dueOn);
            }}
            value={task.dueOn}
          />
        </label>
      )}
      <div className="form-actions">
        <button
          className="primary-button"
          onClick={() => (completed ? onReopen(task.id) : onComplete(task.id))}
          type="button"
        >
          {completed
            ? t("reopenTask", locale)
            : t("completeTask", locale, { task: task.title })}
        </button>
      </div>
    </section>
  );
}
