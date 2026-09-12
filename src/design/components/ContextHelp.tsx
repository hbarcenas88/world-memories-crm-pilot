import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './IconButton';

type ContextHelpProps = Readonly<{
  children: ReactNode;
  label: string;
}>;

/** A compact explanation for a term or rule that is not self-evident. */
export function ContextHelp({ children, label }: ContextHelpProps) {
  return <IconButton className="context-help" label={label} tooltip={children}><Info aria-hidden="true" size={16} /></IconButton>;
}
