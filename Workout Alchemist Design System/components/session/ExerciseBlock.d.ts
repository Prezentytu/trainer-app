import * as React from "react";

export interface ExerciseBlockProps {
  /** Rendered as a mono caps label. */
  name: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  onAddSet?: () => void;
  addLabel?: string;
}

export function ExerciseBlock(props: ExerciseBlockProps): React.ReactElement;
