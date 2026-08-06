import * as React from "react";

export interface SheetProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  /** Centred dialog instead of a bottom sheet. */
  center?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sheet(props: SheetProps): React.ReactElement | null;
