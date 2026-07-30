import * as React from "react";
export interface TagProps {
  /** Shows a × remove affordance */
  onRemove?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tag(props: TagProps): JSX.Element;
