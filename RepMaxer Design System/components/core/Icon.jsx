import React from "react";

const ALIASES = {
  dumbbell: "barbell",
  workout: "person-simple-run",
  progress: "trend-up",
  settings: "gear",
  back: "caret-left",
  forward: "caret-right",
  delete: "trash",
  search: "magnifying-glass",
  edit: "pencil-simple",
};

/**
 * Phosphor glyph. Loaded as a web font, so an icon is just text: it inherits
 * currentColor, scales with font-size and needs no per-icon JS.
 * Requires one stylesheet on the page:
 *   <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
 * (add the /light/ and /bold/ sheets only if you use those weights).
 */
export function Icon({ name, size = 18, weight = "regular", color = "currentColor", className = "" }) {
  const glyph = ALIASES[name] || name;
  const prefix = weight === "regular" ? "ph" : `ph-${weight}`;
  return (
    <i
      aria-hidden
      className={[prefix, `ph-${glyph}`, className].filter(Boolean).join(" ")}
      style={{ fontSize: size, lineHeight: 1, color, display: "inline-flex", flexShrink: 0 }}
    />
  );
}
