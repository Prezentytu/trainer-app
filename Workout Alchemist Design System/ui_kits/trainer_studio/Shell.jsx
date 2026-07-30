function Shell({ nav, onNav, children }) {
  const { Icon } = window.WorkoutAlchemistDesignSystem_5f0610;
  const items = [["clients", "users", "Clients"], ["plans", "flask-conical", "Formulas"], ["library", "dumbbell", "Library"], ["settings", "settings", "Settings"]];
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-app)" }}>
      <aside style={{ width: 224, flex: "none", borderRight: "1px solid var(--border-subtle)", background: "var(--bg-raised)", display: "flex", flexDirection: "column", padding: "20px 12px" }}>
        <div style={{ font: "700 19px/1.1 var(--font-display)", padding: "0 12px", marginBottom: 28 }}>Workout<br /><span style={{ color: "var(--accent)" }}>Alchemist</span></div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(([id, ic, label]) => (
            <button key={id} onClick={() => onNav(id)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--radius-md)", font: "var(--type-body-strong)", fontSize: "var(--text-sm)", color: nav === id ? "var(--accent-hover)" : "var(--text-secondary)", background: nav === id ? "var(--accent-dim)" : "transparent" }}>
              <Icon name={ic} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", font: "var(--type-label)", color: "var(--bone-300)" }}>KD</div>
          <div><div style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)" }}>Coach Kasia</div><div style={{ font: "var(--type-caption)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>12 active clients</div></div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
window.WAShell = Shell;
