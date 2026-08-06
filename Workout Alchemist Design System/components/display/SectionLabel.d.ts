import * as React from "react";

export interface SectionLabelProps {
  children?: React.ReactNode;
  /** Right-hand affordance, usually a plain Button. */
  action?: React.ReactNode;
}

export function SectionLabel(props: SectionLabelProps): React.ReactElement;

export interface DividerProps { margin?: number }

export function Divider(props: DividerProps): React.ReactElement;
