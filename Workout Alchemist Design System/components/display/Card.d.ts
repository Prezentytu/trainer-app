import * as React from "react";
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tiny caps eyebrow above the title */
  eyebrow?: string;
  title?: React.ReactNode;
  /** Caption line under the title */
  meta?: React.ReactNode;
  /** Hover lightens; pointer cursor */
  interactive?: boolean;
  /** Gold border */
  selected?: boolean;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
