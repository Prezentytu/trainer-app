import * as React from "react";
export interface TooltipProps {
  label: string;
  /** @default "top" */
  side?: "top" | "bottom";
  children?: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
