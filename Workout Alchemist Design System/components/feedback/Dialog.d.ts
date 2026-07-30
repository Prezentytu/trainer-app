import * as React from "react";
export interface DialogProps {
  /** @default true */
  open?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** @default "Confirm" */
  confirmLabel?: string;
  /** @default "Cancel" */
  cancelLabel?: string;
  /** Copper confirm button */
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Dialog(props: DialogProps): JSX.Element;
