import * as React from "react";

/**
 * One logged set on a four-column grid.
 * @startingPoint section="Session" subtitle="Set logging grid and exercise block" viewport="700x300"
 */
export interface SetRowProps {
  index: number;
  weight?: string | number;
  reps?: string | number;
  weightSuffix?: string;
  repsSuffix?: string;
  onWeight?: (value: string) => void;
  onReps?: (value: string) => void;
  onDelete?: () => void;
}

export function SetRow(props: SetRowProps): React.ReactElement;

export interface SetRowHeaderProps { left?: string; right?: string }

export function SetRowHeader(props: SetRowHeaderProps): React.ReactElement;
