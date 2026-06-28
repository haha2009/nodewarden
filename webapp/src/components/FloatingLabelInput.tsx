import { useState } from 'preact/hooks';

export interface FloatingLabelInputProps {
  label: string;
  value: string;
  onInput: (v: string) => void;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function FloatingLabelInput(props: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || props.value.length > 0;

  return (
    <label className={`field field-floating${floating ? ' is-floating' : ''}`}>
      <input
        className="input"
        type={props.type || 'text'}
        value={props.value}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        autoFocus={props.autoFocus}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput((e.currentTarget as HTMLInputElement).value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span>{props.label}</span>
    </label>
  );
}
