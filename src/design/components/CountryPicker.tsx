import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocale } from '../../app/i18n';
import {
  countryValueLabel,
  contactCountries,
  filterContactCountries,
  isCountryCode,
  type ContactCountry,
} from '../../domain/contactCountries';
import { useDismissibleLayer } from '../hooks/useDismissibleLayer';

type CountryPickerProps = Readonly<{
  label: string;
  onChange: (countryCode: string) => void;
  optionPresentation?: 'country' | 'phone';
  value: string;
}>;

const pickerCopy = {
  es: { noResults: 'Sin resultados' },
  en: { noResults: 'No results' },
} as const;

function optionLabel(country: ContactCountry, presentation: CountryPickerProps['optionPresentation']): string {
  return presentation === 'phone' ? `${country.label} (${country.code}), +${country.callingCode}` : country.label;
}

export function CountryPicker({ label, onChange, optionPresentation = 'country', value }: CountryPickerProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedCountry = useMemo(() => isCountryCode(value) ? contactCountries(locale).find((country) => country.code === value) : undefined, [locale, value]);
  const displayedValue = selectedCountry ? optionLabel(selectedCountry, optionPresentation) : countryValueLabel(value, locale);
  const matches = useMemo(() => filterContactCountries(query, locale), [locale, query]);
  const activeCountry = matches[activeIndex];
  const listboxId = `${label.replaceAll(/\s+/gu, '-').toLocaleLowerCase()}-countries`;
  const rootRef = useRef<HTMLSpanElement>(null);
  useDismissibleLayer({ isOpen, onDismiss: () => setIsOpen(false), rootRef });

  function openPicker(): void {
    setQuery('');
    setActiveIndex(0);
    setIsOpen(true);
  }

  function select(country: ContactCountry): void {
    onChange(country.code);
    setQuery(country.label);
    setIsOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) openPicker();
      else setActiveIndex((current) => Math.min(current + 1, Math.max(matches.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) openPicker();
      else setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' && isOpen && activeCountry) {
      event.preventDefault();
      select(activeCountry);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setQuery(displayedValue);
      setIsOpen(false);
      return;
    }
    if (event.key === 'Tab') setIsOpen(false);
  }

  return <span className="country-picker" ref={rootRef}><input aria-activedescendant={isOpen && activeCountry ? `${listboxId}-${activeCountry.code}` : undefined} aria-autocomplete="list" aria-controls={listboxId} aria-expanded={isOpen} aria-label={label} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setIsOpen(true); }} onFocus={(event) => { openPicker(); event.currentTarget.select(); }} onKeyDown={onKeyDown} role="combobox" value={isOpen ? query : displayedValue} />{isOpen && <ul aria-label={label} className="country-picker-options" id={listboxId} role="listbox">{matches.length === 0 ? <li className="muted-copy">{pickerCopy[locale].noResults}</li> : matches.map((country, index) => <li aria-selected={index === activeIndex} id={`${listboxId}-${country.code}`} key={country.code} onMouseDown={(event) => { event.preventDefault(); select(country); }} role="option">{optionLabel(country, optionPresentation)}</li>)}</ul>}</span>;
}
