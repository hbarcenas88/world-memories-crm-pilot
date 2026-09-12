import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

type ConfirmDialogProps = Readonly<{
  actions: ReactNode;
  busy?: boolean;
  children: ReactNode;
  onCancel: () => void;
  title: string;
}>;

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({ actions, busy = false, children, onCancel, title }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const safeAction = dialogRef.current?.querySelector<HTMLElement>('[data-dialog-safe]');
    (safeAction ?? dialogRef.current)?.focus();
    return () => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <div className="dialog-backdrop" role="presentation">
    <section aria-label={title} aria-modal="true" className="confirm-dialog" onKeyDown={onKeyDown} ref={dialogRef} role="dialog" tabIndex={-1}>
      <h2>{title}</h2>
      <div className="confirm-dialog-body">{children}</div>
      <div className="form-actions">{actions}</div>
    </section>
  </div>;
}
