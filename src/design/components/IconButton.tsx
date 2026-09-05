import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tooltip } from './Tooltip';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Readonly<{
  children: ReactNode;
  label: string;
  tooltip?: ReactNode;
}>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ children, className = '', label, tooltip = label, ...props }, ref) {
  const button = <button aria-label={label} className={`icon-button ${className}`.trim()} ref={ref} type="button" {...props}>{children}</button>;
  return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : button;
});
