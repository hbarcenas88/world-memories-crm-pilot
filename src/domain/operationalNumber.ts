export type OperationalAmountParseResult = Readonly<{
  valid: boolean;
  value?: number;
}>;

const editableAmountPattern = /^(?:\d*|(?:\d{1,3}(?:,\d{3})+))(?:\.\d{0,2})?$/u;
const completeAmountPattern = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/u;

/**
 * Parses the fixed operational number notation (comma groups, decimal point).
 * It intentionally does not use Number directly on a localized presentation.
 */
export function parseOperationalAmount(input: string): OperationalAmountParseResult {
  const value = input.trim();
  if (value === '') return { valid: true };
  if (!completeAmountPattern.test(value)) return { valid: false };

  const numeric = Number(value.replaceAll(',', ''));
  return Number.isFinite(numeric) && numeric >= 0 ? { valid: true, value: numeric } : { valid: false };
}

export function isEditableOperationalAmount(input: string): boolean {
  return editableAmountPattern.test(input);
}

export function formatOperationalAmount(value: number, minimumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function formatOperationalAmountInput(input: string): string {
  if (input === '') return '';
  const [whole = '', fraction] = input.replaceAll(',', '').split('.');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
  return fraction === undefined ? groupedWhole : `${groupedWhole}.${fraction}`;
}
