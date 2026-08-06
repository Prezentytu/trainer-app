import React from "react";

const UP = "▲";
const DOWN = "▼";
const FLAT = "–";
const STAR = "★";

/** Direction comes from the number's own sign — never from its valence. */
function signGlyph(text) {
  const s = String(text ?? "").trim();
  if (s.startsWith("+")) return UP;
  if (s.startsWith("-") || s.startsWith("−")) return DOWN;
  return null;
}

/** Valence (is this good or bad?) comes from the tone, and only colours. */
function toneGlyph(tone) {
  if (tone === "pr") return STAR;
  if (tone === "gain") return UP;
  if (tone === "loss") return DOWN;
  return FLAT;
}

/**
 * Number first, label under it. The optional `delta` line carries the only
 * colour the system allows on data.
 *
 * Two independent channels, deliberately not merged: the glyph states the
 * DIRECTION of the change and is read off the number's sign, while the colour
 * states its VALENCE and comes from `deltaTone`. That is what lets "-1,2 kg"
 * render as a green ▼ during a cut — falling weight is progress — instead of
 * an up arrow that contradicts the minus beside it.
 */
export function StatTile({ value, unit, label, size = "md", center, sub, tone, delta, deltaTone }) {
  const sign = signGlyph(delta);
  const valence = deltaTone || (sign === UP ? "gain" : sign === DOWN ? "loss" : "flat");
  const glyph = sign || toneGlyph(valence);
  return (
    <div className={["s-stat", center ? "s-stat--center" : ""].filter(Boolean).join(" ")}>
      <span
        className={[
          "s-stat__value",
          size === "lg" ? "s-stat__value--lg" : "",
          tone === "pr" ? "s-stat__value--pr" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
        {unit ? <span className="s-stat__unit">{unit}</span> : null}
      </span>
      {label ? <span className="t-label">{label}</span> : null}
      {delta ? (
        <span className={["s-stat__delta", valence !== "flat" ? `s-stat__delta--${valence}` : ""].filter(Boolean).join(" ")}>
          <span className="s-marker__glyph" aria-hidden>{glyph}</span>
          {delta}
        </span>
      ) : null}
      {sub ? <span className="t-small">{sub}</span> : null}
    </div>
  );
}

/**
 * Standalone data marker for list rows and headers: a PR badge, or a signed
 * change. Same split as StatTile — a signed value gets a direction arrow, an
 * unsigned label ("PR", "uwaga") falls back to the tone's own glyph.
 */
export function Marker({ tone = "flat", children, glyph = true }) {
  const mark = signGlyph(children) || toneGlyph(tone);
  return (
    <span className={`s-marker s-marker--${tone}`}>
      {glyph && mark ? <span className="s-marker__glyph" aria-hidden>{mark}</span> : null}
      {children}
    </span>
  );
}
