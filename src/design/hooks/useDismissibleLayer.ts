import { useEffect, type RefObject } from 'react';

/** Closes a transient CRM layer only when the next pointer target is outside its complete control. */
export function useDismissibleLayer<Element extends HTMLElement>({
  isOpen,
  onDismiss,
  rootRef,
}: Readonly<{
  isOpen: boolean;
  onDismiss: () => void;
  rootRef: RefObject<Element | null>;
}>): void {
  useEffect(() => {
    if (!isOpen) return undefined;
    const dismissOutsideLayer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) onDismiss();
    };
    document.addEventListener('pointerdown', dismissOutsideLayer);
    return () => document.removeEventListener('pointerdown', dismissOutsideLayer);
  }, [isOpen, onDismiss, rootRef]);
}
