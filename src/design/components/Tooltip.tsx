import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';

type TooltipProps = Readonly<{
  children: ReactElement<{ 'aria-describedby'?: string; onBlur?: () => void; onFocus?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }>;
  label: ReactNode;
}>;

export function Tooltip({ children, label }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  if (!isValidElement(children)) throw new Error('Tooltip requires one interactive child');
  const existingDescription = children.props['aria-describedby'];
  const describedBy = [existingDescription, isVisible ? tooltipId : undefined].filter(Boolean).join(' ') || undefined;

  return <span className="tooltip-anchor">
    {cloneElement(children, {
      'aria-describedby': describedBy,
      onBlur: () => { children.props.onBlur?.(); setIsVisible(false); },
      onFocus: () => { children.props.onFocus?.(); setIsVisible(true); },
      onMouseEnter: () => { children.props.onMouseEnter?.(); setIsVisible(true); },
      onMouseLeave: () => { children.props.onMouseLeave?.(); setIsVisible(false); },
    })}
    {isVisible && <span className="tooltip-content" id={tooltipId} role="tooltip">{label}</span>}
  </span>;
}
