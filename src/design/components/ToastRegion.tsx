import { useEffect, useState, type FocusEvent } from 'react';

type ToastRegionProps = Readonly<{
  actionLabel?: string;
  durationMs?: number;
  message: string;
  onAction?: () => void;
  onDismiss?: () => void;
}>;

export function ToastRegion({ actionLabel, durationMs = 6_000, message, onAction, onDismiss }: ToastRegionProps) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!onDismiss || paused) return undefined;
    const timeoutId = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [durationMs, onDismiss, paused]);
  const resumeWhenLeaving = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
  };
  return <div aria-live="polite" className="toast-region">
    <div className="toast" onBlur={resumeWhenLeaving} onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} role="status">
      <span>{message}</span>
      {actionLabel && onAction && <button className="toast-action" onClick={onAction} type="button">{actionLabel}</button>}
    </div>
  </div>;
}
