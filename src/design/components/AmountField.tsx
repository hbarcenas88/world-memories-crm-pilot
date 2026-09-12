import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatOperationalAmount, formatOperationalAmountInput, isEditableOperationalAmount, parseOperationalAmount } from '../../domain/operationalNumber';

type AmountFieldProps = Readonly<{
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  onValidityChange?: (valid: boolean) => void;
  errorMessage: string;
}>;

function caretAfterAmountPosition(value: string, digitsBeforeCaret: number, fractionalDigitsBeforeCaret: number | undefined): number {
  if (fractionalDigitsBeforeCaret !== undefined) {
    const decimal = value.indexOf('.');
    return decimal === -1 ? value.length : decimal + 1 + fractionalDigitsBeforeCaret;
  }
  if (digitsBeforeCaret === 0) return 0;
  let digitsSeen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/u.test(value[index])) digitsSeen += 1;
    if (digitsSeen === digitsBeforeCaret) return index + 1;
  }
  return value.length;
}

export function AmountField({ label, value, onChange, onValidityChange, errorMessage }: AmountFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | undefined>(undefined);
  const lastExternalValue = useRef(value);
  const [text, setText] = useState(value === undefined ? '' : formatOperationalAmount(value));
  const [valid, setValid] = useState(true);
  const errorId = `${label.replace(/\W+/gu, '-').toLowerCase()}-amount-error`;

  useLayoutEffect(() => {
    if (pendingCaret.current === undefined) return;
    const nextCaret = pendingCaret.current;
    pendingCaret.current = undefined;
    inputRef.current?.setSelectionRange(nextCaret, nextCaret);
  }, [text]);

  useEffect(() => {
    if (lastExternalValue.current === value) return;
    lastExternalValue.current = value;
    setText(value === undefined ? '' : formatOperationalAmount(value));
    setValid(true);
    onValidityChange?.(true);
  }, [onValidityChange, value]);

  function setFieldValidity(nextValid: boolean): void {
    setValid(nextValid);
    onValidityChange?.(nextValid);
  }

  return <span className="amount-field">
    <input
      aria-describedby={!valid ? errorId : undefined}
      aria-invalid={!valid || undefined}
      aria-label={label}
      inputMode="decimal"
      onBlur={() => {
        const parsed = parseOperationalAmount(text);
        if (!parsed.valid) {
          setFieldValidity(false);
          return;
        }
        setFieldValidity(true);
        if (parsed.value !== undefined) setText(formatOperationalAmount(parsed.value, 2));
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (!isEditableOperationalAmount(next)) {
          setText(next);
          setFieldValidity(false);
          return;
        }
        const beforeCaret = next.slice(0, event.target.selectionStart ?? next.length);
        const digitsBeforeCaret = beforeCaret.replace(/\D/gu, '').length;
        const decimalInSelection = beforeCaret.indexOf('.');
        const fractionalDigitsBeforeCaret = decimalInSelection === -1 ? undefined : beforeCaret.slice(decimalInSelection + 1).replace(/\D/gu, '').length;
        const formatted = formatOperationalAmountInput(next);
        pendingCaret.current = caretAfterAmountPosition(formatted, digitsBeforeCaret, fractionalDigitsBeforeCaret);
        setText(formatted);
        const parsed = parseOperationalAmount(formatted);
        setFieldValidity(parsed.valid);
        if (parsed.valid) onChange(parsed.value);
      }}
      ref={inputRef}
      value={text}
    />
    {!valid && <small className="form-error" id={errorId}>{errorMessage}</small>}
  </span>;
}
