import { SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';

type FilterBarProps = Readonly<{
  children: ReactNode;
  label: string;
  onClear?: () => void;
}>;

/** Compact, non-disruptive container for view-only filters. */
export function FilterBar({ children, label, onClear }: FilterBarProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const controlsId = useId();
  return <section aria-label={label} className="filter-bar">
    <div className="filter-bar-heading">
      <button aria-controls={controlsId} aria-expanded={isOpen} className="filter-bar-trigger" onClick={() => setIsOpen((current) => !current)} type="button"><SlidersHorizontal aria-hidden="true" size={16} />{label}</button>
      {isOpen && onClear && <button className="text-button" onClick={onClear} type="button">{t('clearFilters', locale)}</button>}
    </div>
    <div hidden={!isOpen} id={controlsId}>{children}</div>
  </section>;
}
