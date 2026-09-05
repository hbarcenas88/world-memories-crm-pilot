import type { CalendarProjection } from './calendarProjection';
import type { Locale } from '../../app/i18n';
import { formatOperationalDate } from '../../domain/operationalDate';

function asDate(value: string): Date { return new Date(`${value}T12:00:00`); }
function asIso(date: Date): string { return date.toISOString().slice(0, 10); }

export function addDays(value: string, amount: number): string {
  const date = asDate(value);
  date.setDate(date.getDate() + amount);
  return asIso(date);
}

export function addMonths(value: string, amount: number): string {
  const date = asDate(value);
  date.setMonth(date.getMonth() + amount);
  return asIso(date);
}

export function monthLabel(value: string, locale: Locale = 'es'): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en-US', { month: 'long', year: 'numeric' }).format(asDate(value)).replace(/^./, (letter) => letter.toUpperCase());
}

export function compactDate(value: string, locale: Locale = 'es'): string {
  void locale;
  return formatOperationalDate(value);
}

export function dateRangeLabel(startOn: string, endOn?: string, locale: Locale = 'es'): string {
  return endOn ? `${compactDate(startOn, locale)}–${compactDate(endOn, locale)}` : compactDate(startOn, locale);
}

export function projectionsForDay(projections: readonly CalendarProjection[], day: string): readonly CalendarProjection[] {
  return projections.filter((projection) => projection.startOn <= day && (projection.endOn ?? projection.startOn) >= day);
}

export function monthDays(reference: string): readonly (string | undefined)[] {
  const date = asDate(reference);
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return [...Array(leading).fill(undefined), ...Array.from({ length: daysInMonth }, (_, index) => asIso(new Date(date.getFullYear(), date.getMonth(), index + 1, 12)))];
}
