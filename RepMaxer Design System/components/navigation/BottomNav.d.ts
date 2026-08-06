import * as React from "react";

export interface BottomNavItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  value: string;
  onChange?: (value: string) => void;
}

export function BottomNav(props: BottomNavProps): React.ReactElement;
