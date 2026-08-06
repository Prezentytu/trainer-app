import * as React from "react";

/**
 * Grey block container, 14px radius, no border, no shadow.
 * @startingPoint section="Display" subtitle="Card, stats, list rows, wordmark" viewport="700x300"
 */
export interface CardProps {
  children?: React.ReactNode;
  /** Transparent with a hairline instead of a fill. */
  flat?: boolean;
  onClick?: () => void;
  pad?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): React.ReactElement;
