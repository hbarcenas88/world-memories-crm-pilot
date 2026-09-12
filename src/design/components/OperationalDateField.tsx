import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocale } from "../../app/i18n";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";
import {
  formatOperationalDate,
  parseOperationalDate,
} from "../../domain/operationalDate";

type OperationalDateFieldProps = Readonly<{
  value?: string;
  onChange: (value: string) => void;
  "aria-label": string;
  disabled?: boolean;
  onValidityChange?: (valid: boolean) => void;
}>;

function monthStart(value: string | undefined): Date {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function OperationalDateFieldState({
  value,
  onChange,
  "aria-label": label,
  disabled,
  onValidityChange,
}: OperationalDateFieldProps) {
  const locale = useLocale();
  const copy =
    locale === "es"
      ? {
          open: "Abrir calendario",
          calendar: "Calendario",
          previous: "Mes anterior",
          next: "Mes siguiente",
          weekdays: ["L", "M", "X", "J", "V", "S", "D"],
        }
      : {
          open: "Open calendar",
          calendar: "Calendar",
          previous: "Previous month",
          next: "Next month",
          weekdays: ["M", "T", "W", "T", "F", "S", "S"],
        };
  const [draft, setDraft] = useState(value ? formatOperationalDate(value) : "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(value ?? toIso(new Date()));
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<HTMLSpanElement>(null);
  useDismissibleLayer({ isOpen: calendarOpen, onDismiss: () => setCalendarOpen(false), rootRef: fieldRef });
  const validDraft = draft.trim() === "" || Boolean(parseOperationalDate(draft));
  useEffect(() => {
    const nextDraft = value ? formatOperationalDate(value) : "";
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setDraft((current) => current === nextDraft ? current : nextDraft);
    });
    return () => { cancelled = true; };
  }, [value]);
  const [month, setMonth] = useState(() => monthStart(value));
  const days = useMemo(() => {
    const firstWeekday = (month.getDay() + 6) % 7;
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
      index < firstWeekday
        ? undefined
        : new Date(
            month.getFullYear(),
            month.getMonth(),
            index - firstWeekday + 1,
          ),
    );
  }, [month]);
  const commit = () => {
    if (draft.trim() === "") {
      onValidityChange?.(true);
      onChange("");
      return;
    }
    const parsed = parseOperationalDate(draft);
    if (parsed) {
      setDraft(formatOperationalDate(parsed));
      onValidityChange?.(true);
      onChange(parsed);
    } else {
      onValidityChange?.(false);
    }
  };
  const selectDate = (nextValue: string) => {
    setDraft(formatOperationalDate(nextValue));
    setFocusedDate(nextValue);
    onValidityChange?.(true);
    onChange(nextValue);
    setCalendarOpen(false);
    queueMicrotask(() => calendarTriggerRef.current?.focus());
  };
  const focusCalendarDate = (next: Date) => {
    const nextValue = toIso(next);
    setFocusedDate(nextValue);
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    requestAnimationFrame(() => calendarRef.current?.querySelector<HTMLButtonElement>(`[data-operational-date="${nextValue}"]`)?.focus());
  };
  const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    if (event.key === 'Escape') {
      event.preventDefault(); setCalendarOpen(false); queueMicrotask(() => calendarTriggerRef.current?.focus()); return;
    }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectDate(toIso(day)); return; }
    const weekday = (day.getDay() + 6) % 7;
    const offset = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7 : event.key === 'Home' ? -weekday : event.key === 'End' ? 6 - weekday : undefined;
    if (offset !== undefined) { event.preventDefault(); focusCalendarDate(new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset)); return; }
    if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); focusCalendarDate(new Date(day.getFullYear(), day.getMonth() + (event.key === 'PageUp' ? -1 : 1), day.getDate())); }
  };
  const typeDate = (nextDraft: string) => {
    setDraft(nextDraft);
    const parsed = parseOperationalDate(nextDraft);
    if (nextDraft.trim() === "") {
      onValidityChange?.(true);
      onChange("");
      return;
    }
    onValidityChange?.(Boolean(parsed));
    if (parsed) onChange(parsed);
  };
  return (
    <span className="operational-date-field" ref={fieldRef}>
      <input
        aria-label={label}
        aria-invalid={!validDraft || undefined}
        disabled={disabled}
        inputMode="numeric"
        onBlur={commit}
        onChange={(event) => typeDate(event.target.value)}
        pattern="\d{2}/\d{2}/\d{4}"
        placeholder="DD/MM/YYYY"
        value={draft}
      />
      <button
        aria-expanded={calendarOpen}
        aria-label={`${copy.open}: ${label}`}
        className="icon-button"
        disabled={disabled}
        onClick={() => setCalendarOpen((open) => {
          const nextOpen = !open;
          if (nextOpen) {
            const nextValue = parseOperationalDate(draft) ?? value ?? toIso(new Date());
            setFocusedDate(nextValue);
            setMonth(monthStart(nextValue));
            requestAnimationFrame(() => calendarRef.current?.querySelector<HTMLButtonElement>(`[data-operational-date="${nextValue}"]`)?.focus());
          }
          return nextOpen;
        })}
        ref={calendarTriggerRef}
        type="button"
      >
        <CalendarDays aria-hidden="true" size={18} />
      </button>
      {calendarOpen && (
        <span
          aria-label={`${copy.calendar}: ${label}`}
          className="operational-calendar"
          ref={calendarRef}
          role="dialog"
        >
          <span className="calendar-month-controls">
            <button
              aria-label={copy.previous}
              className="icon-button"
              onClick={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <strong>
              {new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </strong>
            <button
              aria-label={copy.next}
              className="icon-button"
              onClick={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </span>
          <span className="calendar-grid" role="grid">
            {copy.weekdays.map((day, index) => (
              <span aria-hidden="true" key={`${day}-${index}`}>
                {day}
              </span>
            ))}
            {days.map((day, index) =>
              day ? (
                <button
                  aria-label={formatOperationalDate(toIso(day))}
                  aria-selected={value === toIso(day)}
                  data-operational-date={toIso(day)}
                  key={toIso(day)}
                  onClick={() => selectDate(toIso(day))}
                  onKeyDown={(event) => onDayKeyDown(event, day)}
                  role="gridcell"
                  tabIndex={focusedDate === toIso(day) ? 0 : -1}
                  type="button"
                >
                  {day.getDate()}
                </button>
              ) : (
                <span aria-hidden="true" key={`empty-${index}`} />
              ),
            )}
          </span>
        </span>
      )}
    </span>
  );
}

export function OperationalDateField(props: OperationalDateFieldProps) {
  return <OperationalDateFieldState {...props} />;
}
