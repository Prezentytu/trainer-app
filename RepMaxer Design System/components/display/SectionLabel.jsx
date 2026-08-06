import React from "react";

/** Mono caps section heading with an optional right-hand action. */
export function SectionLabel({ children, action }) {
  return (
    <div className="s-sectionlabel">
      <span className="t-label">{children}</span>
      {action ? <span>{action}</span> : null}
    </div>
  );
}

/** 1px hairline. The system's only separator. */
export function Divider({ margin = 0 }) {
  return <hr className="s-divider" style={{ marginTop: margin, marginBottom: margin }} />;
}
