import * as React from "react";

export interface FieldProps {
  /** Mono uppercase tracked micro-label. */
  label?: string;
  children?: React.ReactNode;
}

export function Field(props: FieldProps): React.ReactElement;
