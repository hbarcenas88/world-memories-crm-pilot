const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const operationalDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

function isRealDate(year: number, month: number, day: number): boolean {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

function pad(value: number): string { return String(value).padStart(2, '0'); }

export function parseOperationalDate(value: string): string | undefined {
  const match = operationalDatePattern.exec(value.trim());
  if (!match) return undefined;
  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue); const month = Number(monthValue); const year = Number(yearValue);
  return isRealDate(year, month, day) ? `${yearValue}-${monthValue}-${dayValue}` : undefined;
}

export function formatOperationalDate(value: string | undefined): string {
  if (!value) return '—';
  const datePart = value.slice(0, 10);
  const iso = isoDatePattern.exec(datePart);
  if (iso && isRealDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return '—';
}

export function formatOperationalDateTime(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return formatOperationalDate(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatOperationalNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
