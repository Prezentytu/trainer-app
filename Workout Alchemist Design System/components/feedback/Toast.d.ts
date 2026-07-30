import * as React from "react";
export interface ToastProps {
  /** Icon tint @default "neutral" */
  tone?: "neutral" | "positive" | "danger" | "pr";
  icon?: React.ReactNode;
  /** Inline gold action label, e.g. "Undo" */
  action?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
