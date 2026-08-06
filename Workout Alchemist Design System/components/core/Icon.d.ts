import * as React from "react";

export interface IconProps {
  /** Phosphor name, kebab-case (e.g. "barbell", "trend-up"). A few plain-English aliases are accepted: dumbbell, workout, progress, settings, back, forward, delete, search, edit. */
  name: string;
  /** Font size in px. 18 inline, 20 in nav. */
  size?: number;
  /** Phosphor weight. Load the matching stylesheet if you leave "regular". */
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  className?: string;
}

export function Icon(props: IconProps): React.ReactElement;
