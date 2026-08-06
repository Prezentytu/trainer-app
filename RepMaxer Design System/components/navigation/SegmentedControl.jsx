import React from "react";

/** Two or three equal views. Active segment is a solid inverted fill. */
export function SegmentedControl({ items, value, onChange }) {
  return (
    <div className="s-seg" role="group">
      {items.map((item) => {
        const v = typeof item === "string" ? item : item.value;
        const label = typeof item === "string" ? item : item.label;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange && onChange(v)}
            className={["s-seg__btn", v === value ? "is-active" : ""].filter(Boolean).join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
