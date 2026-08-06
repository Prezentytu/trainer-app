const { Card, SectionLabel, ListRow, StatTile, Marker, Button, Icon, LineChart, SegmentedControl, Divider } =
  window.WorkoutAlchemistDesignSystem_381a04;

const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");

function ClientScreen({ onBack }) {
  const c = window.PANEL.client;
  const [tab, setTab] = React.useState("Historia");

  return (
    <div>
      <Button variant="plain" size="sm" onClick={onBack}>← Klienci</Button>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginTop: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="t-title" style={{ margin: 0 }}>{c.name}</h1>
          <p className="t-small" style={{ margin: "4px 0 0" }}>{c.email} · {c.goal}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button variant="outline" size="sm">Skopiuj link</Button>
          <Button size="sm">Otwórz plan</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginTop: 28 }}>
        <Card>
          <SectionLabel action={<span className="t-label">{c.week}</span>}>Aktywny plan</SectionLabel>
          <p className="t-heading" style={{ margin: "6px 0 0" }}>{c.plan}</p>
          <p className="t-small" style={{ margin: "4px 0 0" }}>Następny: {c.next}</p>
          <div style={{ marginTop: 16 }}>
            <LineChart points={c.volume} height={64} showAxis={false} dots={false} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
            <span className="t-label">Objętość · 7 tygodni</span>
            <Marker tone="gain">+12%</Marker>
          </div>
        </Card>
        <Card flat>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <StatTile value={c.stats.sessions30} label="Treningi (30 dni)" delta="+2" />
            <StatTile value={c.stats.best} unit="kg" label="Rekord — przysiad" tone="pr" delta="+5 kg" />
            <StatTile value={c.stats.prs} label="Nowe rekordy (30 dni)" tone="pr" />
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 32, maxWidth: 320 }}>
        <SegmentedControl value={tab} onChange={setTab} items={["Historia", "Plan"]} />
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "Historia" ? (
          <>
            <SectionLabel>Ostatnie treningi</SectionLabel>
            {c.history.map((h, i) => (
              <ListRow
                key={i}
                title={h.name}
                sub={`${h.date} · ${h.sets} serii · ${nf(h.volume)} kg`}
                right={<Icon name="caret-right" size={15} color="var(--fg-faint)" />}
                onClick={() => {}}
              />
            ))}
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {c.plan_days.map((d) => (
              <Card key={d.code}>
                <SectionLabel action={<span className="t-label">{d.code}</span>}>{d.name}</SectionLabel>
                {d.items.map((it, i) => (
                  <p key={i} className="t-small" style={{ margin: i ? "8px 0 0" : "4px 0 0", color: "var(--fg-muted)" }}>{it}</p>
                ))}
                <Divider margin={14} />
                <Button variant="plain" size="sm">+ Ćwiczenie</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ClientScreen });
