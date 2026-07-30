function PlanBuilderScreen({ client, onBack }) {
  const { Button, Input, Select, Tag, Icon, Dialog, Toast, IconButton } = window.WorkoutAlchemistDesignSystem_5f0610;
  const [days, setDays] = React.useState(() => JSON.parse(JSON.stringify(window.WAData.plan.days)));
  const [sel, setSel] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [dlg, setDlg] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const lib = window.WAData.library.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  const add = (e) => setDays(days.map((d, i) => i === sel ? { ...d, ex: [...d.ex, { name: e.name, sets: "3 × 10", load: "— kg", rest: "90s" }] } : d));
  const remove = (di, xi) => setDays(days.map((d, i) => i === di ? { ...d, ex: d.ex.filter((_, j) => j !== xi) } : d));
  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh" }}>
      <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>
        <button onClick={onBack} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, font: "var(--type-caption)", color: "var(--text-muted)", marginBottom: 16 }}><Icon name="arrow-left" size={16} /> {client.name}</button>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 24 }}>
          <Input label="Plan name" defaultValue={window.WAData.plan.name} style={{ width: 240 }} />
          <Select label="Weeks" options={["4", "6", "8", "12"]} defaultValue="6" style={{ width: 90 }} />
          <div style={{ flex: 1 }}></div>
          <Button variant="secondary" icon={<Icon name="flask-conical" size={18} />}>Save as formula</Button>
          <Button icon={<Icon name="send" size={18} />} onClick={() => setDlg(true)}>Assign to {client.name.split(" ")[0]}</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
          {days.map((d, di) => (
            <div key={d.label} onClick={() => setSel(di)} style={{ background: "var(--surface-card)", border: "1px solid " + (sel === di ? "var(--accent)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 14, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <span style={{ font: "var(--type-label)", color: "var(--text-faint)", letterSpacing: "var(--tracking-caps)" }}>DAY {di + 1}</span>
                <span style={{ font: "var(--type-h3)" }}>{d.label}</span>
                <span style={{ font: "var(--type-mono-sm)", color: "var(--text-faint)", marginLeft: "auto" }}>{d.ex.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {d.ex.map((x, xi) => (
                  <div key={xi} style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="grip-vertical" size={14} style={{ color: "var(--text-faint)" }} />
                      <span style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)", flex: 1 }}>{x.name}</span>
                      <IconButton label="Remove" size="sm" onClick={(ev) => { ev.stopPropagation(); remove(di, xi); }}><Icon name="x" size={14} /></IconButton>
                    </div>
                    <div style={{ display: "flex", gap: 12, font: "var(--type-mono-sm)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4, paddingLeft: 22 }}>
                      <span>{x.sets}</span><span style={{ color: "var(--accent)" }}>{x.load}</span><span>rest {x.rest}</span>
                    </div>
                  </div>
                ))}
                <button style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: "9px 0", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-strong)", font: "var(--type-caption)", color: "var(--text-muted)" }}>+ Add from library</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside style={{ width: 280, flex: "none", borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-raised)", padding: 20, overflow: "auto" }}>
        <div style={{ font: "var(--type-h3)", marginBottom: 4 }}>Exercise library</div>
        <div style={{ font: "var(--type-caption)", color: "var(--text-faint)", marginBottom: 12 }}>Adds to <span style={{ color: "var(--accent)" }}>{days[sel].label}</span></div>
        <Input placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lib.map((e) => (
            <div key={e.name} onClick={() => add(e)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: "var(--type-body-strong)", fontSize: "var(--text-sm)" }}>{e.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>{e.tags.map((t) => <Tag key={t} style={{ height: 20, fontSize: "var(--text-xs)", padding: "0 8px" }}>{t}</Tag>)}</div>
              </div>
              <Icon name="plus" size={16} style={{ color: "var(--text-muted)" }} />
            </div>
          ))}
        </div>
      </aside>
      {dlg && <Dialog title={"Assign to " + client.name + "?"} description="She gets the plan in her app immediately. The current plan is archived." confirmLabel="Assign plan" onConfirm={() => { setDlg(false); setToast(true); setTimeout(() => setToast(false), 3200); }} onCancel={() => setDlg(false)} />}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 120 }}><Toast tone="positive" icon={<Icon name="check" size={18} />}>Plan assigned to {client.name.split(" ")[0]}</Toast></div>}
    </div>
  );
}
window.WAPlanBuilderScreen = PlanBuilderScreen;
