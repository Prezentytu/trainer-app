import React from "react";
export function Icon({ name, size = 20, strokeWidth = 1.75, style }) {
  const lib = typeof window !== "undefined" && window.lucide && window.lucide.icons;
  const pascal = String(name).split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  const node = lib && (lib[pascal] || lib[name]);
  if (!node) return <svg width={size} height={size} style={style}></svg>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", ...style }}>
      {node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
