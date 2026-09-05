import type { DateRange } from './types';

export function travelRange(ranges: readonly DateRange[]): DateRange | null {
  if (ranges.length === 0) {
    return null;
  }

  return ranges.slice(1).reduce<DateRange>((current, range) => ({
    startOn: range.startOn < current.startOn ? range.startOn : current.startOn,
    endOn: range.endOn > current.endOn ? range.endOn : current.endOn,
  }), ranges[0]);
}

export function ageAtDate(birthDate: string, referenceDate: string): Readonly<{ years: number; months: number }> {
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const [referenceYear, referenceMonth, referenceDay] = referenceDate.split('-').map(Number);
  let years = referenceYear - birthYear;
  let months = referenceMonth - birthMonth;
  if (referenceDay < birthDay) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}
