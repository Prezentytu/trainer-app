import React from "react";

/**
 * One exercise inside a workout: mono caps name, delete affordance, a stack of
 * SetRows, then "+ Add set". Separated from the next block by a hairline.
 */
export function ExerciseBlock({ name, action, children, onAddSet, addLabel = "+ Dodaj serię" }) {
  return (
    <section className="s-exercise">
      <div className="s-exercise__head">
        <span className="s-exercise__name">{name}</span>
        {action}
      </div>
      {children}
      {onAddSet ? (
        <button type="button" className="s-addset" onClick={onAddSet}>
          {addLabel}
        </button>
      ) : null}
    </section>
  );
}
