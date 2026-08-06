import React from "react";

/** Hairline-separated list row: title, mono sub-line, optional right side. */
export function ListRow({ title, sub, right, onClick, leading }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={["s-row", onClick ? "" : "s-row--static"].filter(Boolean).join(" ")}
    >
      {leading ? <span style={{ flexShrink: 0, display: "inline-flex" }}>{leading}</span> : null}
      <span className="s-row__main">
        <span className="s-row__title" style={{ display: "block" }}>{title}</span>
        {sub ? <span className="s-row__sub" style={{ display: "block" }}>{sub}</span> : null}
      </span>
      {right ? <span style={{ flexShrink: 0 }}>{right}</span> : null}
    </Tag>
  );
}
