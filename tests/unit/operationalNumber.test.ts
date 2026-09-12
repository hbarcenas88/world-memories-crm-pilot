import { describe, expect, it } from 'vitest';
import { formatOperationalAmount, formatOperationalAmountInput, isEditableOperationalAmount, parseOperationalAmount } from '../../src/domain/operationalNumber';

describe('operational amounts', () => {
  it.each([
    ['', undefined],
    ['0', 0],
    ['1234.56', 1234.56],
    ['1,234.56', 1234.56],
  ])('parses %s without relying on Number for grouped input', (input, expected) => {
    expect(parseOperationalAmount(input)).toEqual({ valid: true, ...(expected === undefined ? {} : { value: expected }) });
  });

  it.each(['1,2,3', '12abc', '-1', '1.', '1.234'])('rejects invalid final input %s', (input) => {
    expect(parseOperationalAmount(input)).toEqual({ valid: false });
  });

  it('keeps incomplete but editable text separate from a valid final amount', () => {
    expect(isEditableOperationalAmount('1.')).toBe(true);
    expect(parseOperationalAmount('1.')).toEqual({ valid: false });
  });

  it('formats groups while preserving the fixed decimal notation', () => {
    expect(formatOperationalAmountInput('1234.5')).toBe('1,234.5');
    expect(formatOperationalAmount(1234.5, 2)).toBe('1,234.50');
  });
});
