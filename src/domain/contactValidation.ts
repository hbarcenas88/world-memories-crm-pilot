const emailPattern = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]+$/u;

export type OptionalEmailValidation = Readonly<{
  value: string;
  valid: boolean;
}>;

/** Validates only the safe shape of an optional email; it never checks mailbox ownership or delivery. */
export function validateOptionalEmail(input: string | undefined): OptionalEmailValidation {
  const value = input?.trim() ?? '';
  return { value, valid: value === '' || emailPattern.test(value) };
}
