function ProgressScreen() {
  const { Card, StatBlock, Badge, Icon, SegmentedControl } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [range, setRange] = React.useState("Month");
  const bars = [42, 55, 48, 61, 58, 70, 66, 74];
  return (
    <div style={{ padding: "16px 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ font: "var(--type-h2)", margin: 0, flex: 1 }}>Progress</h1>
        <SegmentedControl items={["Week", "Month", "Year"]} value={range} onChange={setRange} />
      </div>
      <Card eyebrow="Bench press · top set" title="">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ font: "var(--type-stat-lg)", color: "var(--pr)" }}>62.5</span>
          <span style={{ font: "var(--type-mono-sm)", color: "var(--text-muted)" }}>kg</span>
          <span style={{ font: "var(--type-mono-sm)", color: "var(--positive)", marginLeft: "auto" }}>+12% this {range.toLowerCase()}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72, marginTop: 16 }}>
          {bars.map((h, i) => <div key={i} style={{ flex: 1, height: h + "%", borderRadius: "4px 4px 0 0", background: i === bars.length - 1 ? "var(--pr)" : "var(--ink-700)" }}></div>)}
        </div>
      </Card>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Card style={{ flex: 1, padding: 16 }}><StatBlock label="Volume" value="48.2k" unit="kg" delta="+8%" /></Card>
        <Card style={{ flex: 1, padding: 16 }}><StatBlock label="Sessions" value="14" delta="+2" /></Card>
        <Card style={{ flex: 1, padding: 16 }}><StatBlock label="PRs" value="3" /></Card>
      </div>
      <div style={{ font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", margin: "20px 0 10px" }}>History</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {window.WAAppData.history.map((h, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
            <span style={{ font: "var(--type-label)", color: "var(--text-faint)", width: 30 }}>{h.d}</span>
            <span style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)", flex: 1 }}>{h.t}</span>
            <span style={{ font: "var(--type-mono-sm)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{h.m}</span>
            {h.pr && <Badge tone="pr">PR</Badge>}
            <Icon name="chevron-right" size={14} style={{ color: "var(--text-faint)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
window.WAProgressScreen = ProgressScreen;
