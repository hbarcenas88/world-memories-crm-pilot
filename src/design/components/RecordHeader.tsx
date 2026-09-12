import type { ReactNode } from 'react';
import { ActionRow } from './ActionRow';

type RecordHeaderProps = Readonly<{
  actions?: ReactNode;
  eyebrow?: ReactNode;
  headingLevel?: 1 | 2;
  hideTitle?: boolean;
  title: ReactNode;
}>;

export function RecordHeader({ actions, eyebrow, headingLevel = 2, hideTitle = false, title }: RecordHeaderProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return <header className="record-header">
    <div className="record-header-copy">
      {eyebrow && <p className="detail-status">{eyebrow}</p>}
      {!hideTitle && <Heading>{title}</Heading>}
    </div>
    {actions && <ActionRow className="record-header-actions">{actions}</ActionRow>}
  </header>;
}
