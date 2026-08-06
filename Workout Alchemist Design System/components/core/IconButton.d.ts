import * as React from "react";

export interface IconButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  /** Doubles as aria-label. */
  title?: string;
  /** Grey well behind the glyph. */
  filled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function IconButton(props: IconButtonProps): React.ReactElement;
