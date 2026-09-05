import { describe, expect, it } from 'vitest';
import { formatOperationalDate, formatOperationalDateTime, formatOperationalNumber, parseOperationalDate } from '../../src/domain/operationalDate';

describe('operational date contract', () => {
  it('presents ISO dates in fixed DD/MM/YYYY independently from interface language', () => {
    expect(formatOperationalDate('2026-08-31')).toBe('31/08/2026');
    expect(formatOperationalDateTime('2026-08-31T14:05:00.000Z')).toMatch(/^31\/08\/2026 \d{2}:\d{2}$/);
  });

  it('parses only real DD/MM/YYYY dates into ISO values', () => {
    expect(parseOperationalDate('29/02/2028')).toBe('2028-02-29');
    expect(parseOperationalDate('31/08/2026')).toBe('2026-08-31');
    expect(parseOperationalDate('31/02/2026')).toBeUndefined();
    expect(parseOperationalDate('08/31/2026')).toBeUndefined();
  });

  it('presents operational numbers with comma thousands and a fixed decimal point', () => {
    expect(formatOperationalNumber(1280)).toBe('1,280.00');
    expect(formatOperationalNumber(18.4)).toBe('18.40');
  });
});
