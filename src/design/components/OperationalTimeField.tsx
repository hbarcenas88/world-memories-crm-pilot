import { useEffect, useState } from 'react';

type OperationalTimeFieldProps = Readonly<{
  value?: string;
  onChange: (value: string) => void;
  'aria-label': string;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
}>;

function formatDraft(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isOperationalTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match !== null && Number(match[1]) < 24 && Number(match[2]) < 60;
}

export function OperationalTimeField({ value, onChange, 'aria-label': label, disabled, onValidityChange }: OperationalTimeFieldProps) {
  const [draft, setDraft] = useState(value ?? '');
  const valid = draft === '' || isOperationalTime(draft);

  useEffect(() => {
    const nextDraft = value ?? '';
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setDraft((current) => current === nextDraft ? current : nextDraft);
    });
    return () => { cancelled = true; };
  }, [value]);

  function update(nextValue: string): void {
    const nextDraft = formatDraft(nextValue);
    setDraft(nextDraft);
    const nextValid = nextDraft === '' || isOperationalTime(nextDraft);
    onValidityChange?.(nextValid);
    if (nextDraft === '' || nextValid) onChange(nextDraft);
  }

  return <input aria-invalid={!valid || undefined} aria-label={label} disabled={disabled} inputMode="numeric" maxLength={5} onBlur={() => onValidityChange?.(valid)} onChange={(event) => update(event.target.value)} pattern="\d{2}:\d{2}" placeholder="HH:mm" value={draft} />;
}
