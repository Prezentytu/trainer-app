import * as React from "react";

/**
 * Solid / outline / plain / danger button.
 * @startingPoint section="Core" subtitle="Buttons, pills, fields, switch" viewport="700x260"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  /** solid = inverted fill (white on black). One per screen. */
  variant?: "solid" | "outline" | "plain" | "danger";
  size?: "sm" | "md" | "lg";
  /** Mono uppercase tracked label — used for FINISH-style commits. */
  caps?: boolean;
  full?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

export function Button(props: ButtonProps): React.ReactElement;
