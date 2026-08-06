import * as React from "react";

export interface ListRowProps {
  title: React.ReactNode;
  /** Mono meta line under the title. */
  sub?: React.ReactNode;
  right?: React.ReactNode;
  leading?: React.ReactNode;
  /** Omit for a static row. */
  onClick?: () => void;
}

export function ListRow(props: ListRowProps): React.ReactElement;
