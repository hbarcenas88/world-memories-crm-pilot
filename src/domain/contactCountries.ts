import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';
import type { Locale } from '../app/i18n';

export type ContactCountry = Readonly<{
  code: CountryCode;
  callingCode: string;
  label: string;
}>;

const countryCodes = getCountries();
const countriesByLocale = new Map<Locale, readonly ContactCountry[]>();
const normalizePattern = /\p{Diacritic}/gu;

function localizedName(code: CountryCode, locale: Locale): string {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  return displayNames.of(code) ?? code;
}

export function normalizeCountrySearch(value: string): string {
  return value.normalize('NFD').replace(normalizePattern, '').toLocaleLowerCase();
}

export function contactCountries(locale: Locale): readonly ContactCountry[] {
  const cached = countriesByLocale.get(locale);
  if (cached) return cached;
  const countries = countryCodes
    .map((code) => ({ code, callingCode: getCountryCallingCode(code), label: localizedName(code, locale) }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
  countriesByLocale.set(locale, countries);
  return countries;
}

export function isCountryCode(value: string | undefined): value is CountryCode {
  return value !== undefined && (countryCodes as readonly string[]).includes(value);
}

export function countryValueLabel(value: string, locale: Locale): string {
  return isCountryCode(value) ? localizedName(value, locale) : value;
}

export function filterContactCountries(query: string, locale: Locale): readonly ContactCountry[] {
  const normalizedQuery = normalizeCountrySearch(query);
  if (normalizedQuery === '') return contactCountries(locale);
  return contactCountries(locale).filter((country) => {
    const englishName = localizedName(country.code, 'en');
    return [country.code, country.label, englishName, `+${country.callingCode}`]
      .some((candidate) => normalizeCountrySearch(candidate).includes(normalizedQuery));
  });
}

export function selectedPhoneCountry(value: string): CountryCode | undefined {
  if (!value.trim().startsWith('+')) return undefined;
  return parsePhoneNumberFromString(value)?.country;
}

/** Keeps a historical free-form phone untouched unless an operator explicitly selects a prefix. */
export function withPhoneCountryPrefix(value: string, country: CountryCode | undefined): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/gu, '')}`;
  if (!country) return value;
  const nationalDigits = trimmed.replace(/\D/gu, '');
  return nationalDigits === '' ? '' : `+${getCountryCallingCode(country)}${nationalDigits}`;
}
