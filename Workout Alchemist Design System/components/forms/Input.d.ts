import * as React from "react";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Tiny caps label above the field */
  label?: string;
  hint?: string;
  /** Copper border + message; replaces hint */
  error?: string;
  prefix?: React.ReactNode;
  /** Unit suffix, e.g. "kg", "reps" */
  suffix?: React.ReactNode;
  /** Mono digits — weights, reps, timers */
  mono?: boolean;
  /** @default "md" */
  size?: "sm" | "md";
}
export declare function Input(props: InputProps): JSX.Element;
