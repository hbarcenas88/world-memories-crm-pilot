import { describe, expect, it } from 'vitest';
import { ageAtDate, travelRange } from '../../src/domain/dates';

describe('travelRange', () => {
  it('derives a trip interval from the earliest service start and latest service end', () => {
    expect(
      travelRange([
        { startOn: '2026-09-08', endOn: '2026-09-12' },
        { startOn: '2026-09-05', endOn: '2026-09-07' },
      ]),
    ).toEqual({ startOn: '2026-09-05', endOn: '2026-09-12' });
  });

  it('returns null when no dated service exists so it cannot invent calendar dates', () => {
    expect(travelRange([])).toBeNull();
  });

  it('derives a family member age in years and months without persisting it', () => {
    expect(ageAtDate('1990-02-10', '2026-08-26')).toEqual({ years: 36, months: 6 });
    expect(ageAtDate('2020-12-15', '2026-08-26')).toEqual({ years: 5, months: 8 });
  });
});
