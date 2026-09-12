type OperationProgressProps = Readonly<{
  completed?: number;
  label: string;
  total?: number;
}>;

/** Shows measured progress when counts exist, or a truthful operation stage otherwise. */
export function OperationProgress({ completed, label, total }: OperationProgressProps) {
  const hasMeasuredProgress = total !== undefined && total > 0 && completed !== undefined;
  const safeCompleted = Math.min(Math.max(completed ?? 0, 0), total ?? 0);

  if (!hasMeasuredProgress) return <p className="operation-progress operation-progress--indeterminate" role="status">{label}</p>;

  return <div aria-label={label} className="operation-progress">
    <span>{label}</span>
    <progress max={total} value={safeCompleted}>{safeCompleted} de {total}</progress>
    <small>{safeCompleted} de {total}</small>
  </div>;
}
