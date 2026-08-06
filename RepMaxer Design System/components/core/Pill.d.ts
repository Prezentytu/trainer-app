import * as React from "react";

export interface PillProps {
  children?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Sentence-case sans instead of mono caps (exercise names). */
  text?: boolean;
}

export function Pill(props: PillProps): React.ReactElement;

export interface PillRowProps { children?: React.ReactNode }

/** Horizontal scroller, hidden scrollbar. */
export function PillRow(props: PillRowProps): React.ReactElement;
