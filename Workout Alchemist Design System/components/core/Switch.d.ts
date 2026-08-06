import * as React from "react";

export interface SwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Switch(props: SwitchProps): React.ReactElement;
