import type { ReactNode } from 'react';

type ActionRowProps = Readonly<{
  align?: 'start' | 'end';
  children: ReactNode;
  className?: string;
}>;

export function ActionRow({ align = 'end', children, className = '' }: ActionRowProps) {
  return <div className={`action-row action-row--${align} ${className}`.trim()}>{children}</div>;
}
