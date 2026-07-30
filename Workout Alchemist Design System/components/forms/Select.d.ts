import * as React from "react";
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  /** Strings or {value,label} pairs */
  options?: Array<string | { value: string; label: string }>;
  /** @default "md" */
  size?: "sm" | "md";
}
export declare function Select(props: SelectProps): JSX.Element;
