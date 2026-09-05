import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from './IconButton';

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

  useEffect(() => {
    if (isOpen) firstActionRef.current?.focus();
  }, [isOpen]);

  function closeAndReturnFocus(): void {
    setIsOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  return <div className="action-menu">
    <IconButton aria-expanded={isOpen} aria-haspopup="menu" label={label} onClick={() => setIsOpen((current) => !current)} ref={triggerRef}>
      <Ellipsis aria-hidden="true" size={20} />
    </IconButton>
    {isOpen && <div className="action-menu-popover" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndReturnFocus();
      }
    }} role="menu">
      {actions.map((action, index) => <button className={action.tone === 'danger' ? 'action-menu-danger' : undefined} key={action.id} onClick={() => {
        closeAndReturnFocus();
        action.onSelect();
      }} ref={index === 0 ? firstActionRef : undefined} role="menuitem" type="button">{action.label}</button>)}
    </div>}
  </div>;
}
