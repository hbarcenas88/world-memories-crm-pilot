import { useState } from 'react';
import { selectedPhoneCountry, withPhoneCountryPrefix } from '../../domain/contactCountries';
import { CountryPicker } from './CountryPicker';

type PhoneFieldProps = Readonly<{
  countryLabel: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>;

export function PhoneField({ countryLabel, label, onChange, value }: PhoneFieldProps) {
  const [country, setCountry] = useState(() => selectedPhoneCountry(value));

  return <span className="phone-field"><CountryPicker label={countryLabel} onChange={(nextCountry) => { setCountry(nextCountry as typeof country); onChange(withPhoneCountryPrefix(value, nextCountry as typeof country)); }} optionPresentation="phone" value={country ?? ''} /><input aria-label={label} inputMode="tel" onChange={(event) => onChange(withPhoneCountryPrefix(event.target.value, country))} type="tel" value={value} /></span>;
}
