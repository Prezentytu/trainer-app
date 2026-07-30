function TodayScreen({ onStart }) {
  const { Button, Badge, Card, Icon, ProgressRing } = window.WorkoutAlchemistDesignSystem_5f0610;
  const w = window.WAAppData.workout;
  return (
    <div style={{ padding: "16px 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>Thursday · Week {w.week}</div>
          <h1 style={{ font: "var(--type-h2)", margin: "4px 0 0" }}>Today</h1>
        </div>
        <div style={{ marginLeft: "auto" }}><ProgressRing value={2 / 3} label="2/3" sub="week" size={56} stroke={4} /></div>
      </div>
      <Card eyebrow={"Day " + w.dayNum + " · from Coach Kasia"} title={w.label} meta={w.ex.length + " exercises · ~" + w.mins + " min"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: "14px 0 18px" }}>
          {w.ex.map((x, i) => (
            <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < w.ex.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <Icon name="dumbbell" size={18} style={{ color: "var(--text-faint)" }} />
              <span style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)", flex: 1 }}>{x.name}</span>
              <span style={{ font: "var(--type-mono-sm)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{x.target}</span>
            </div>
          ))}
        </div>
        <Button full size="lg" icon={<Icon name="play" size={20} />} onClick={onStart}>Start workout</Button>
      </Card>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <Card style={{ flex: 1, padding: 16 }} eyebrow="Streak" title="9 sessions" meta="Keep the chain going"></Card>
        <Card style={{ flex: 1, padding: 16 }} eyebrow="Last gold" title="62.5 kg bench"><Badge tone="pr" style={{ marginTop: 8 }}>PR</Badge></Card>
      </div>
    </div>
  );
}
window.WATodayScreen = TodayScreen;
