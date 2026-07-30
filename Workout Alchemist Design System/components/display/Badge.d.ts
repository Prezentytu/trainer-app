import * as React from "react";
export interface BadgeProps {
  /** pr = personal best (the ONLY gold in the product) · accent = teal highlight · positive = done/on-track · danger = missed · neutral @default "neutral" */
  tone?: "pr" | "accent" | "positive" | "danger" | "neutral";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
