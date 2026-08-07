"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { Field, inputClass } from "@/components/ui";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
  error?: string | null;
  name?: string;
  disabled?: boolean;
};

export function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  autoComplete = "current-password",
  placeholder = "Wprowadź hasło",
  error,
  name = "password",
  disabled,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <Field label={label}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          tabIndex={-1}
        >
          <Icon name={visible ? "eye-slash" : "eye"} size={18} decorative />
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </Field>
  );
}
