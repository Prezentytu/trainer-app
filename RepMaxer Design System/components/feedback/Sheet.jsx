import React from "react";

/** Bottom sheet (default) or centred dialog. Scrim, no shadow, 20px radius. */
export function Sheet({ open, onClose, title, center, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={["s-sheet", center ? "s-sheet--center" : ""].filter(Boolean).join(" ")}>
      <button type="button" aria-label="Zamknij" className="s-sheet__scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="s-sheet__panel">
        {title ? <p className="t-heading" style={{ margin: "0 0 12px" }}>{title}</p> : null}
        {children}
        {footer ? <div style={{ marginTop: 20, display: "flex", gap: 8 }}>{footer}</div> : null}
      </div>
    </div>
  );
}
