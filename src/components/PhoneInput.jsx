import React, { useEffect, useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import {
  getCountryCallingCode,
  isSupportedCountry,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { COUNTRIES } from '@/constants/registration';

const DEFAULT_DIAL_COUNTRY = 'AU';

const DIAL_OPTIONS = COUNTRIES
  .filter((c) => isSupportedCountry(c.code))
  .map((c) => ({ code: c.code, name: c.name, dial: getCountryCallingCode(c.code) }));

/**
 * The full international number (+61412345678) from what was typed and the
 * chosen country code. Handles a typed leading 0 (0412 345 678) and a number
 * typed with its own +code. Falls back to a plain join so an invalid number
 * still reaches validation rather than silently becoming empty.
 */
const toInternational = (national, dialCountry) => {
  const typed = national.trim();
  if (!typed) return '';
  const parsed = parsePhoneNumberFromString(typed, dialCountry);
  return parsed?.number ?? `+${getCountryCallingCode(dialCountry)}${typed.replace(/\D/g, '')}`;
};

export const isValidPhone = (value) => Boolean(value) && isValidPhoneNumber(value);

/**
 * WhatsApp number with a country-code picker. `value` and `onChange` deal in the
 * full international number. Until the user picks a code themselves, it follows
 * `country` (the country chosen elsewhere on the form).
 */
export const PhoneInput = ({ id, value, onChange, country, fieldClassName, invalid }) => {
  const [dialCountry, setDialCountry] = useState(() => {
    const parsed = value ? parsePhoneNumberFromString(value) : null;
    if (parsed?.country) return parsed.country;
    return country && isSupportedCountry(country) ? country : DEFAULT_DIAL_COUNTRY;
  });
  const [national, setNational] = useState(() =>
    value ? parsePhoneNumberFromString(value)?.formatNational() ?? value : ''
  );
  const [isDialChosen, setIsDialChosen] = useState(Boolean(value));

  useEffect(() => {
    if (isDialChosen || !country || !isSupportedCountry(country)) return;
    setDialCountry(country);
    if (national) onChange(toInternational(national, country));
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseDial = (code) => {
    setDialCountry(code);
    setIsDialChosen(true);
    onChange(toInternational(national, code));
  };

  const typeNumber = (text) => {
    setNational(text);
    onChange(toInternational(text, dialCountry));
  };

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <div className={`${fieldClassName} !w-auto !pl-4 !pr-9 flex items-center gap-1.5 whitespace-nowrap`}>
          <span className="text-slate-400 text-xs font-semibold">{dialCountry}</span>
          <span>+{getCountryCallingCode(dialCountry)}</span>
        </div>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          aria-label="Country code"
          value={dialCountry}
          onChange={(e) => chooseDial(e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        >
          {DIAL_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} (+{option.dial})
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex-1 min-w-0">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="412 345 678"
          value={national}
          onChange={(e) => typeNumber(e.target.value)}
          aria-invalid={invalid || undefined}
          className={`${fieldClassName} ${invalid ? '!border-red-400' : ''}`}
        />
      </div>
    </div>
  );
};
