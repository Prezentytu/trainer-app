import * as React from "react";

export interface TopBarProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
}

export function TopBar(props: TopBarProps): React.ReactElement;
