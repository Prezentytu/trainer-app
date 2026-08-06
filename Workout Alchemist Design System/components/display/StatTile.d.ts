import * as React from "react";

export type DataTone = "pr" | "gain" | "loss" | "flat";

export interface StatTileProps {
  value: string | number;
  /** Small mono unit tucked against the value. */
  unit?: string;
  /** Mono caps label under the number. */
  label?: string;
  size?: "md" | "lg";
  center?: boolean;
  sub?: string;
  /** "pr" paints the value gold — personal records only. */
  tone?: "pr";
  /** Signed change, e.g. "+12%" or "-3 kg". The arrow glyph follows the sign. */
  delta?: string;
  /** Valence — colours the delta only, never flips its arrow. Use when a falling number is good (body weight during a cut). */
  deltaTone?: DataTone;
}

export function StatTile(props: StatTileProps): React.ReactElement;

export interface MarkerProps {
  /** gold PR · green improvement · red decline · neutral. */
  tone?: DataTone;
  children?: React.ReactNode;
  /** Set false to drop the ▲▼–★ glyph (rare — it is the non-colour signal). */
  glyph?: boolean;
}

export function Marker(props: MarkerProps): React.ReactElement;
