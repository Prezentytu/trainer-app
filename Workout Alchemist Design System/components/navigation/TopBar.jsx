import React from "react";

/** 56px screen bar: left action, centre title, right action. No borders. */
export function TopBar({ left, title, right }) {
  return (
    <div className="s-topbar">
      <span style={{ flex: 1, display: "flex", justifyContent: "flex-start", minWidth: 0 }}>{left}</span>
      {title ? <span className="s-topbar__title">{title}</span> : null}
      <span style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 8, minWidth: 0 }}>{right}</span>
    </div>
  );
}
