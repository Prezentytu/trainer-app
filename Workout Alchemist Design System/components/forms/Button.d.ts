import * as React from "react";
/** @startingPoint section="Forms" subtitle="Primary, secondary, ghost and danger actions" viewport="700x220" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. Max one primary (gold) per view region. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (Lucide, 20px, currentColor) */
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Stretch to container width (mobile sticky actions) */
  full?: boolean;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
