import { cloneElement, isValidElement, useCallback, useEffect, useId, useState, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = Readonly<{
  children: ReactElement<{ 'aria-describedby'?: string; onBlur?: () => void; onFocus?: () => void; onKeyDown?: (event: KeyboardEvent) => void; onMouseEnter?: () => void; onMouseLeave?: (event: MouseEvent<HTMLElement>) => void }>;
  label: ReactNode;
}>;

const viewportGutter = 8;
const tooltipGap = 10;

export function Tooltip({ children, label }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const anchorId = `${tooltipId}-anchor`;
  if (!isValidElement(children)) throw new Error('Tooltip requires one interactive child');

  const positionTooltip = useCallback(() => {
    const anchor = document.querySelector<HTMLElement>(`[data-tooltip-anchor="${anchorId}"]`);
    const tooltip = document.getElementById(tooltipId);
    if (!anchor || !tooltip) return;
    const anchorRect = anchor.getBoundingClientRect();
    tooltip.style.maxWidth = `${Math.min(280, window.innerWidth - viewportGutter * 2)}px`;
    const tooltipRect = tooltip.getBoundingClientRect();
    const left = Math.min(Math.max(viewportGutter, anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2), window.innerWidth - tooltipRect.width - viewportGutter);
    const placeBelow = anchorRect.top < tooltipRect.height + tooltipGap + viewportGutter;
    const top = placeBelow ? Math.min(window.innerHeight - tooltipRect.height - viewportGutter, anchorRect.bottom + tooltipGap) : Math.max(viewportGutter, anchorRect.top - tooltipRect.height - tooltipGap);
    tooltip.dataset.placement = placeBelow ? 'bottom' : 'top';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }, [anchorId, tooltipId]);

  useEffect(() => {
    if (!isVisible) return undefined;
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [isVisible, positionTooltip]);

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);
  const existingDescription = children.props['aria-describedby'];
  const describedBy = [existingDescription, isVisible ? tooltipId : undefined].filter(Boolean).join(' ') || undefined;

  return <span className="tooltip-anchor" data-tooltip-anchor={anchorId}>
    {cloneElement(children, {
      'aria-describedby': describedBy,
      onBlur: () => { children.props.onBlur?.(); hide(); },
      onFocus: () => { children.props.onFocus?.(); show(); },
      onKeyDown: (event: KeyboardEvent) => { children.props.onKeyDown?.(event); if (event.key === 'Escape') { event.preventDefault(); hide(); } },
      onMouseEnter: () => { children.props.onMouseEnter?.(); show(); },
      onMouseLeave: (event: MouseEvent<HTMLElement>) => {
        children.props.onMouseLeave?.(event);
        if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.getAttribute('role') === 'tooltip') return;
        hide();
      },
    })}
    {isVisible && createPortal(<span className="tooltip-content" id={tooltipId} onMouseEnter={show} onMouseLeave={hide} role="tooltip" style={{ position: 'fixed' }}>{label}</span>, document.body)}
  </span>;
}
