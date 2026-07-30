export interface IconProps {
  /** Lucide icon name, kebab-case, e.g. "dumbbell", "flask-conical" */
  name: string;
  /** px @default 20 */
  size?: number;
  /** @default 1.75 */
  strokeWidth?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
