const { SectionLabel, ListRow, StatTile, Marker, Button, Icon, Input, Card } = window.WorkoutAlchemistDesignSystem_381a04;

function ClientsScreen({ onOpen }) {
  const p = window.PANEL;
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const rows = p.clients
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => (filter === "all" ? true : c.state === "attention"));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
        <h1 className="t-title" style={{ margin: 0 }}>Klienci</h1>
        <Button size="sm">Dodaj klienta</Button>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
        <StatTile value={p.stats.clients} label="Klienci" size="lg" />
        <StatTile value={p.stats.sessions7} label="Sesje (7 dni)" size="lg" delta="+3" />
        <StatTile value={p.stats.prs7} label="Rekordy (7 dni)" size="lg" tone="pr" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 36 }}>
        <div style={{ width: 260 }}>
          <Input value={q} onChange={setQ} placeholder="Szukaj klienta…" />
        </div>
        <button
          type="button"
          className={["s-pill", filter === "all" ? "is-active" : ""].join(" ")}
          onClick={() => setFilter("all")}
        >
          Wszyscy
        </button>
        <button
          type="button"
          className={["s-pill", filter === "attention" ? "is-active" : ""].join(" ")}
          onClick={() => setFilter("attention")}
        >
          Wymagają uwagi
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionLabel>{rows.length} z {p.clients.length}</SectionLabel>
        {rows.map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            sub={`${c.plan} · ostatni trening ${c.last}`}
            right={
              <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span className="t-num" style={{ fontSize: 13, color: "var(--fg)" }}>
                  {c.sessions}
                </span>
                {c.state === "attention" ? <Marker tone="loss">uwaga</Marker> : null}
                <Icon name="caret-right" size={15} color="var(--fg-faint)" />
              </span>
            }
            onClick={() => onOpen(c)}
          />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ClientsScreen });
