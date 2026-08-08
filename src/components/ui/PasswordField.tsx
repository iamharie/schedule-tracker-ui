import { useState } from 'react';
import { IconEye, IconEyeOff } from './icons';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  className?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  className,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`auth-field${className ? ` ${className}` : ''}`}>
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <div className="auth-field__password-wrap">
        <input
          id={id}
          className="auth-field__input auth-field__input--password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          className="auth-field__toggle-visibility"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
        </button>
      </div>
    </div>
  );
}
