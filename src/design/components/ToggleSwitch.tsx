type ToggleSwitchProps = Readonly<{
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}>;

/** A setting-only switch. Commercial and financial states keep explicit actions. */
export function ToggleSwitch({ checked, disabled = false, label, onChange }: ToggleSwitchProps) {
  return <button aria-checked={checked} aria-label={label} className="toggle-switch" disabled={disabled} onClick={() => onChange(!checked)} role="switch" type="button"><span aria-hidden="true" className="toggle-switch-thumb" /></button>;
}
