import * as React from "react";

export interface LineChartProps {
  /** Series values, oldest first. */
  points: number[];
  /** Sparse x-axis labels; first and last are edge-aligned. */
  labels?: string[];
  height?: number;
  showAxis?: boolean;
  dots?: boolean;
}

export function LineChart(props: LineChartProps): React.ReactElement;
