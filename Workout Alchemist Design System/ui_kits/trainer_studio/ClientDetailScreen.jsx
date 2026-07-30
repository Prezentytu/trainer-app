function ClientDetailScreen({ client, onBack, onEditPlan }) {
  const { Button, Badge, Card, StatBlock, Icon, ProgressRing } = window.WorkoutAlchemistDesignSystem_5f0610;
  const plan = window.WAData.plan;
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <button onClick={onBack} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, font: "var(--type-caption)", color: "var(--text-muted)", marginBottom: 16 }}><Icon name="arrow-left" size={16} /> Clients</button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", font: "var(--type-body-strong)", color: "var(--bone-300)" }}>{client.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1 style={{ font: "var(--type-h2)", margin: 0 }}>{client.name}</h1><Badge tone={client.tone}>{client.status}</Badge></div>
          <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 2 }}>{client.plan} · week 3 of {plan.weeks}</div>
        </div>
        <Button variant="secondary" icon={<Icon name="message-circle" size={18} />}>Message</Button>
        <Button icon={<Icon name="flask-conical" size={18} />} onClick={onEditPlan}>Edit plan</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card><StatBlock label="Adherence" value={Math.round(client.adherence * 100) + "%"} delta="+4% vs last month" /></Card>
        <Card><StatBlock label="Sessions this week" value="2/3" /></Card>
        <Card><StatBlock label="Bench top set" value="62.5" unit="kg" delta="+2.5 vs last week" /></Card>
        <Card style={{ display: "flex", alignItems: "center", gap: 16 }}><ProgressRing value={0.68} label="68%" sub="plan" size={72} /><div style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>Week 3 of 6<br />on schedule</div></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Card eyebrow="Current plan" title={plan.name} meta={plan.days.length + " days / week · " + plan.weeks + " weeks"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {plan.days.map((d, i) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <span style={{ font: "var(--type-label)", color: "var(--text-faint)", letterSpacing: "var(--tracking-caps)", width: 44 }}>DAY {i + 1}</span>
                <span style={{ font: "var(--type-body-strong)", flex: 1 }}>{d.label}</span>
                <span style={{ font: "var(--type-mono-sm)", color: "var(--text-muted)" }}>{d.ex.length} exercises</span>
              </div>
            ))}
          </div>
        </Card>
        <Card eyebrow="Recent activity" title="Last 7 days">
          <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
            {[["check", "Completed Pull day", "Yesterday · 52 min", "var(--positive)"], ["flame", "PR — bench press 62.5 kg", "Tuesday", "var(--pr)"], ["check", "Completed Push day", "Tuesday · 58 min", "var(--positive)"], ["x", "Skipped Leg day", "Sunday", "var(--danger)"]].map(([ic, t, m, col], i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}>
                <Icon name={ic} size={18} style={{ color: col, marginTop: 2 }} />
                <div><div style={{ font: "var(--type-body)", fontSize: "var(--text-sm)" }}>{t}</div><div style={{ font: "var(--type-caption)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{m}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
window.WAClientDetailScreen = ClientDetailScreen;
