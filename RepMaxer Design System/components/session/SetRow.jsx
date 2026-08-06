import React from "react";
import { Input } from "../core/Input.jsx";

/** Column headings for a stack of SetRows. */
export function SetRowHeader({ left = "Ciężar (kg)", right = "Powt." }) {
  return (
    <div className="s-setgrid s-setgrid--head">
      <span className="t-label">Set</span>
      <span className="t-label">{left}</span>
      <span className="t-label">{right}</span>
      <span />
    </div>
  );
}

/**
 * One logged set: number, weight, reps, delete. Four columns, no card, no
 * borders — the grid is the structure.
 */
export function SetRow({ index, weight, reps, weightSuffix = "kg", repsSuffix = "reps", onWeight, onReps, onDelete }) {
  return (
    <div className="s-setgrid" style={{ paddingTop: 4, paddingBottom: 4 }}>
      <span className="s-setrow__n">{index}</span>
      <span className="s-setrow__cell">
        <Input num value={weight} onChange={onWeight} ariaLabel="ciężar" />
        <span className="s-setrow__suffix">{weightSuffix}</span>
      </span>
      <span className="s-setrow__cell">
        <Input num value={reps} onChange={onReps} ariaLabel="powtórzenia" />
        <span className="s-setrow__suffix">{repsSuffix}</span>
      </span>
      <button type="button" className="s-setrow__del" onClick={onDelete} aria-label="Usuń serię">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </button>
    </div>
  );
}
