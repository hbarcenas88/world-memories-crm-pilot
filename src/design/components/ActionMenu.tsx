import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { IconButton } from './IconButton';
import { useDismissibleLayer } from '../hooks/useDismissibleLayer';

export type ActionMenuItem = Readonly<{
  id: string;
  label: string;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}>;

export function ActionMenu({ actions, label }: Readonly<{ actions: readonly ActionMenuItem[]; label: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) firstActionRef.current?.focus();
  }, [isOpen]);

  useDismissibleLayer({ isOpen, onDismiss: () => setIsOpen(false), rootRef });

  function closeAndReturnFocus(): void {
    setIsOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function moveFocus(event: KeyboardEvent<HTMLDivElement>): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = actionRefs.current.findIndex((item) => item === document.activeElement);
    const fallback = current < 0 ? 0 : current;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? actions.length - 1 : event.key === 'ArrowDown' ? (fallback + 1) % actions.length : (fallback - 1 + actions.length) % actions.length;
    actionRefs.current[next]?.focus();
  }

  return <div className="action-menu" ref={rootRef}>
    <IconButton aria-expanded={isOpen} aria-haspopup="menu" label={label} onClick={() => setIsOpen((current) => !current)} ref={triggerRef}>
      <Ellipsis aria-hidden="true" size={20} />
    </IconButton>
    {isOpen && <div className="action-menu-popover" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndReturnFocus();
        return;
      }
      if (event.key === 'Tab') {
        setIsOpen(false);
        return;
      }
      moveFocus(event);
    }} ref={menuRef} role="menu">
      {actions.map((action, index) => <button className={action.tone === 'danger' ? 'action-menu-danger' : undefined} key={action.id} onClick={() => {
        closeAndReturnFocus();
        action.onSelect();
      }} ref={(element) => { actionRefs.current[index] = element; if (index === 0) firstActionRef.current = element; }} role="menuitem" type="button">{action.label}</button>)}
    </div>}
  </div>;
}
