import { useState } from 'react';
import type { DependencySummary } from '../../application/recordImpact';
import { activityEventLabel } from '../../app/activityEventLabel';
import { t, useLocale } from '../../app/i18n';
import { formatOperationalDateTime } from '../../domain/operationalDate';

export function ImpactDetails({ dependencies }: Readonly<{ dependencies: readonly DependencySummary[] }>) {
  const locale = useLocale();
  const [visibleCounts, setVisibleCounts] = useState<Readonly<Record<string, number>>>({});
  return <div className="impact-details">
    {dependencies.map((dependency) => {
      const items = dependency.items ?? [];
      const visibleCount = visibleCounts[dependency.label] ?? 10;
      const remaining = Math.max(0, items.length - visibleCount);
      return <details key={dependency.label}>
        <summary>{dependency.label}: {dependency.count}</summary>
        <ul>{items.slice(0, visibleCount).map((item) => <li key={item.id}>{item.eventType
          ? `${activityEventLabel(item.eventType, locale)} · ${formatOperationalDateTime(item.occurredAt)}`
          : item.label}</li>)}</ul>
        {remaining > 0 && <button className="text-button" onClick={() => setVisibleCounts((current) => ({ ...current, [dependency.label]: visibleCount + 10 }))} type="button">{t('showMore', locale, { count: Math.min(10, remaining) })}</button>}
      </details>;
    })}
  </div>;
}
