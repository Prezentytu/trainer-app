function ClientsScreen({ onOpen }) {
  const { Button, Input, Tabs, Badge, Icon } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [tab, setTab] = React.useState("active");
  const [q, setQ] = React.useState("");
  const rows = window.WAData.clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <h1 style={{ font: "var(--type-h1)", margin: 0, flex: 1 }}>Clients</h1>
        <Input placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
        <Button icon={<Icon name="plus" size={18} />}>Invite client</Button>
      </div>
      <Tabs items={[{ value: "active", label: "Active", count: 5 }, { value: "pending", label: "Pending", count: 2 }, { value: "archived", label: "Archived" }]} value={tab} onChange={setTab} style={{ marginBottom: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.4fr) 1.2fr 100px 1fr 1fr 90px 24px", gap: 16, padding: "10px 16px", font: "var(--type-label)", color: "var(--text-faint)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>
        <span>Client</span><span>Plan</span><span>Adherence</span><span>Last session</span><span>Next up</span><span>Status</span><span></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((c) => (
          <div key={c.id} onClick={() => onOpen(c)} className="wa-row" style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.4fr) 1.2fr 100px 1fr 1fr 90px 24px", gap: 16, alignItems: "center", padding: "12px 16px", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", font: "var(--type-label)", color: "var(--bone-300)", flex: "none" }}>{c.initials}</span>
              <span style={{ font: "var(--type-body-strong)" }}>{c.name}</span>
            </span>
            <span style={{ font: "var(--type-caption)", color: c.plan.startsWith("No") ? "var(--text-faint)" : "var(--text-secondary)" }}>{c.plan}</span>
            <span style={{ font: "var(--type-mono-sm)", color: c.adherence >= 0.85 ? "var(--positive)" : c.adherence >= 0.6 ? "var(--text-secondary)" : c.adherence > 0 ? "var(--danger)" : "var(--text-faint)" }}>{c.adherence ? Math.round(c.adherence * 100) + "%" : "—"}</span>
            <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{c.last}</span>
            <span style={{ font: "var(--type-caption)", color: c.next === "Overdue" ? "var(--danger)" : "var(--text-secondary)" }}>{c.next}</span>
            <Badge tone={c.tone}>{c.status}</Badge>
            <Icon name="chevron-right" size={16} style={{ color: "var(--text-faint)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
window.WAClientsScreen = ClientsScreen;
