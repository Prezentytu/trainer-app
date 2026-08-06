import * as React from "react";

export interface WordmarkProps {
  children?: React.ReactNode;
  size?: number;
  className?: string;
}

export function Wordmark(props: WordmarkProps): React.ReactElement;
