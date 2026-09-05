import { t, useLocale } from '../../app/i18n';

export type ArchiveFilter = 'active' | 'archived' | 'all';

export function ArchiveFilterChips({ onChange, value }: Readonly<{ onChange: (value: ArchiveFilter) => void; value: ArchiveFilter }>) {
  const locale = useLocale();
  return <div aria-label={t('showRecords', locale)} className="filter-chips" role="group">
    {(['active', 'archived', 'all'] as const).map((filter) => <button aria-pressed={value === filter} className="filter-chip" key={filter} onClick={() => onChange(filter)} type="button">{t(filter, locale)}</button>)}
  </div>;
}
