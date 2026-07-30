export interface ProgressRingProps {
  /** 0–1 */
  value?: number;
  /** px @default 64 */
  size?: number;
  /** @default 5 */
  stroke?: number;
  /** @default "var(--accent)" */
  color?: string;
  /** Center mono numeral, e.g. "4/6" */
  label?: string;
  /** Tiny caps sub-label */
  sub?: string;
  style?: React.CSSProperties;
}
export declare function ProgressRing(props: ProgressRingProps): JSX.Element;
