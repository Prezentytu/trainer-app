import * as React from "react";

export interface InputProps {
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Mono, bold, centred, tabular — every numeric field. */
  num?: boolean;
  /** Static unit rendered outside the well ("kg", "reps"). */
  suffix?: string;
  ariaLabel?: string;
  inputMode?: string;
  disabled?: boolean;
  className?: string;
}

export function Input(props: InputProps): React.ReactElement;
