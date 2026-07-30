function WorkoutScreen({ onFinish }) {
  const { Button, Icon, ProgressRing, Badge } = window.WorkoutAlchemistDesignSystem_5f0610;
  const w = window.WAAppData.workout;
  const [exi, setExi] = React.useState(0);
  const [done, setDone] = React.useState(w.ex.map((x) => x.sets.map(() => false)));
  const [rest, setRest] = React.useState(0);
  React.useEffect(() => { if (rest <= 0) return; const t = setTimeout(() => setRest(rest - 1), 1000); return () => clearTimeout(t); }, [rest]);
  const x = w.ex[exi];
  const total = w.ex.reduce((a, e) => a + e.sets.length, 0);
  const nDone = done.flat().filter(Boolean).length;
  const toggle = (si) => {
    const was = done[exi][si];
    setDone(done.map((d, i) => i === exi ? d.map((v, j) => j === si ? !v : v) : d));
    if (!was) setRest(x.rest);
  };
  const fmt = (s) => String(Math.floor(s / 60)) + ":" + String(s % 60).padStart(2, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", position: "sticky", top: 0, background: "rgba(11,12,10,0.8)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <button onClick={onFinish} style={{ all: "unset", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><Icon name="chevron-down" size={22} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)" }}>{w.label}</div>
          <div style={{ font: "var(--type-mono-sm)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{nDone}/{total} sets</div>
        </div>
        {rest > 0 ? <ProgressRing value={rest / x.rest} color="var(--teal-300)" label={fmt(rest)} size={46} stroke={4} /> : <Badge tone="positive">Live</Badge>}
      </div>
      <div style={{ padding: "18px 20px", flex: 1 }}>
        <div style={{ font: "var(--type-label)", color: "var(--text-muted)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>Exercise {exi + 1} of {w.ex.length}</div>
        <h2 style={{ font: "var(--type-h2)", margin: "4px 0 2px" }}>{x.name}</h2>
        <div style={{ font: "var(--type-mono-sm)", color: "var(--accent)", marginBottom: 16 }}>{x.target} · rest {fmt(x.rest)}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {x.sets.map((s, si) => {
            const on = done[exi][si];
            return (
              <button key={si} onClick={() => toggle(si)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, minHeight: 44, padding: "10px 14px", borderRadius: "var(--radius-md)", background: on ? "var(--positive-dim)" : "var(--surface-card)", border: "1px solid " + (on ? "var(--teal-700)" : "var(--border-subtle)"), transition: "background var(--dur-fast) var(--ease-out)" }}>
                <span style={{ font: "var(--type-label)", color: "var(--text-faint)", letterSpacing: "var(--tracking-caps)", width: 40 }}>SET {si + 1}</span>
                <span style={{ font: "var(--type-stat)", fontSize: 20 }}>{s.w}<span style={{ font: "var(--type-mono-sm)", color: "var(--text-muted)" }}> kg</span></span>
                <span style={{ font: "var(--type-stat)", fontSize: 20 }}>{s.r}<span style={{ font: "var(--type-mono-sm)", color: "var(--text-muted)" }}> reps</span></span>
                <span style={{ marginLeft: "auto", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: on ? "var(--teal-300)" : "var(--ink-700)", color: on ? "var(--ink-950)" : "var(--text-faint)" }}><Icon name="check" size={16} /></span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "14px 20px 24px", position: "sticky", bottom: 0, background: "rgba(11,12,10,0.8)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-subtle)" }}>
        <Button variant="secondary" full disabled={exi === 0} onClick={() => setExi(exi - 1)} icon={<Icon name="arrow-left" size={18} />}>Back</Button>
        {exi < w.ex.length - 1
          ? <Button full onClick={() => setExi(exi + 1)} icon={<Icon name="arrow-right" size={18} />}>Next exercise</Button>
          : <Button full onClick={onFinish} icon={<Icon name="check" size={18} />}>Finish workout</Button>}
      </div>
    </div>
  );
}
window.WAWorkoutScreen = WorkoutScreen;
