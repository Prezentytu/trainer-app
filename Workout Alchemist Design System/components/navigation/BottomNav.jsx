import React from "react";

/**
 * Floating pill nav — three or four destinations, centred over the screen.
 * Active tab is a lighter fill, never a colour.
 */
export function BottomNav({ items, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <nav className="s-bottomnav">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange && onChange(item.value)}
              aria-current={active ? "page" : undefined}
              className={["s-bottomnav__btn", active ? "is-active" : ""].filter(Boolean).join(" ")}
            >
              {item.icon}
              <span className="s-bottomnav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
