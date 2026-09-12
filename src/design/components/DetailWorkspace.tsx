import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';

type DetailWorkspaceProps = Readonly<{
  breadcrumb: readonly string[];
  children: ReactNode;
  onClose: () => void;
  title: string;
}>;

export function DetailWorkspace({ breadcrumb, children, onClose, title }: DetailWorkspaceProps) {
  const locale = useLocale();
  return <section className="detail-workspace" aria-label={title}>
    <header className="detail-workspace-header">
      <nav aria-label={t('workspacePath', locale)}>
        <ol className="detail-breadcrumb">{breadcrumb.map((item, index) => {
          const isCurrent = index === breadcrumb.length - 1;
          return <li aria-current={isCurrent ? 'page' : undefined} key={`${index}-${item}`}>
            {isCurrent ? item : <button className="breadcrumb-link" onClick={onClose} type="button">{item}</button>}
          </li>;
        })}</ol>
      </nav>
      <button className="secondary-button" onClick={onClose} type="button"><ArrowLeft aria-hidden="true" size={18} />{t('backToList', locale)}</button>
      <h1>{title}</h1>
    </header>
    <div className="detail-workspace-content">{children}</div>
  </section>;
}
