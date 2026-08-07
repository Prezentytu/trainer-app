"use client";

import {
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const LENGTH = 6;

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  autoFocus?: boolean;
};

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, "").slice(0, LENGTH);
}

export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  error,
  autoFocus,
}: CodeInputProps) {
  const id = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function handleChange(index: number, raw: string) {
    const digit = digitsOnly(raw).slice(-1);
    const nextChars = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
    nextChars[index] = digit;
    const cleaned = digitsOnly(nextChars.join(""));
    onChange(cleaned);

    if (digit && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
    if (cleaned.length === LENGTH) onComplete?.(cleaned);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      e.preventDefault();
      const nextChars = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
      nextChars[index - 1] = "";
      onChange(digitsOnly(nextChars.join("")));
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = digitsOnly(e.clipboardData.getData("text"));
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, LENGTH) - 1;
    refs.current[Math.max(focusIndex, 0)]?.focus();
    if (pasted.length === LENGTH) onComplete?.(pasted);
  }

  return (
    <div>
      <div className="flex justify-between gap-2" role="group" aria-label="Kod weryfikacyjny">
        {cells.map((digit, index) => (
          <input
            key={`${id}-${index}`}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={digit}
            aria-label={`Cyfra ${index + 1} z ${LENGTH}`}
            aria-invalid={error ? true : undefined}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="h-12 w-full min-w-0 rounded-[var(--r-field)] border border-border-strong bg-field text-center font-mono text-lg font-semibold tabular-nums text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus:border-foreground focus:shadow-[var(--focus-ring)] disabled:opacity-45"
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
