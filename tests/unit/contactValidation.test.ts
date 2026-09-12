import { describe, expect, it } from 'vitest';
import { validateOptionalEmail } from '../../src/domain/contactValidation';

describe('validateOptionalEmail', () => {
  it.each([
    ['ana+viajes@example.org', 'ana+viajes@example.org'],
    [' ana@example.com.mx ', 'ana@example.com.mx'],
    ['', ''],
  ])('accepts an optional address with a public-style domain: %s', (input, value) => {
    expect(validateOptionalEmail(input)).toEqual({ value, valid: true });
  });

  it.each(['anaexample.com', 'ana@', '@example.com', 'ana b@example.com'])('rejects malformed addresses: %s', (input) => {
    expect(validateOptionalEmail(input)).toEqual({ value: input.trim(), valid: false });
  });
});
