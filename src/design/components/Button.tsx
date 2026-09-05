import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button className={`primary-button ${className}`} type="button" {...props}>{children}</button>;
}
