export interface StatBlockProps {
  /** Tiny caps label, e.g. "TOP SET" */
  label: string;
  /** Mono numeral */
  value: string | number;
  unit?: string;
  /** e.g. "+12% vs June" — leading + renders verdigris */
  delta?: string;
  /** @default "md" */
  size?: "md" | "lg";
  style?: React.CSSProperties;
}
export declare function StatBlock(props: StatBlockProps): JSX.Element;
