import { useMemo, useState } from "react";
import { useLocale } from "../../app/i18n";
import {
  formatOperationalDate,
  parseOperationalDate,
} from "../../domain/operationalDate";

type OperationalDateFieldProps = Readonly<{
  value?: string;
  onChange: (value: string) => void;
  "aria-label": string;
  disabled?: boolean;
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
      onChange("");
      return;
    }
    const parsed = parseOperationalDate(draft);
    if (parsed) {
      setDraft(formatOperationalDate(parsed));
      onChange(parsed);
    }
  };
  const typeDate = (nextDraft: string) => {
    setDraft(nextDraft);
    const parsed = parseOperationalDate(nextDraft);
    if (parsed) onChange(parsed);
  };
  return (
    <span className="operational-date-field">
      <input
        aria-label={label}
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
        onClick={() => setCalendarOpen((open) => !open)}
        type="button"
      >
        ▦
      </button>
      {calendarOpen && (
        <span
          aria-label={`${copy.calendar}: ${label}`}
          className="operational-calendar"
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
              ‹
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
              ›
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
                  key={toIso(day)}
                  onClick={() => {
                    const nextValue = toIso(day);
                    setDraft(formatOperationalDate(nextValue));
                    onChange(nextValue);
                    setCalendarOpen(false);
                  }}
                  role="gridcell"
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
  return <OperationalDateFieldState key={props.value ?? ""} {...props} />;
}
