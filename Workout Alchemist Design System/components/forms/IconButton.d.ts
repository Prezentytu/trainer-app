import * as React from "react";
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name (required — icon-only control) */
  label: string;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** @default "ghost" */
  variant?: "ghost" | "outline";
  /** Gold-tinted pressed/selected state */
  active?: boolean;
  disabled?: boolean;
  /** The icon (Lucide, currentColor) */
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
