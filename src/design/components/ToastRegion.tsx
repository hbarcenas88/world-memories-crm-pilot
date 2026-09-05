type ToastRegionProps = Readonly<{
  actionLabel?: string;
  message: string;
  onAction?: () => void;
}>;

export function ToastRegion({ actionLabel, message, onAction }: ToastRegionProps) {
  return <div aria-live="polite" className="toast-region">
    <div className="toast" role="status">
      <span>{message}</span>
      {actionLabel && onAction && <button className="toast-action" onClick={onAction} type="button">{actionLabel}</button>}
    </div>
  </div>;
}
