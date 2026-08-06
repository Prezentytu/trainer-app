const { Card, SectionLabel, ListRow, StatTile, Marker, Button, IconButton, Icon, LineChart } =
  window.WorkoutAlchemistDesignSystem_381a04;

const WD = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");

function MonthGrid() {
  const a = window.APP;
  const cells = [];
  for (let i = 0; i < a.firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= a.monthDays; d++) cells.push(d);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12 }}>
        <IconButton title="Poprzedni miesiąc" size="sm"><Icon name="caret-left" size={15} /></IconButton>
        <span className="t-label">{a.month}</span>
        <IconButton title="Następny miesiąc" size="sm"><Icon name="caret-right" size={15} /></IconButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {WD.map((w) => (
          <span key={w} className="t-label" style={{ textAlign: "center", paddingBottom: 6 }}>{w}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const trained = a.trainedDays.includes(d);
          const isToday = d === a.today;
          return (
            <span key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0" }}>
              <span
                className="t-num"
                style={{
                  fontSize: 13,
                  fontWeight: isToday || trained ? 700 : 400,
                  color: isToday || trained ? "var(--fg)" : "var(--fg-faint)",
                }}
              >
                {d}
              </span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: trained ? "var(--fg)" : "transparent",
                  border: isToday && !trained ? "1px solid var(--fg-faint)" : "1px solid transparent",
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutsScreen({ onOpen, onNew }) {
  const a = window.APP;
  return (
    <div style={{ padding: "28px var(--gutter) 140px" }}>
      <header>
        <h1 className="t-title" style={{ margin: 0 }}>{a.greeting}</h1>
        <p className="t-small" style={{ margin: "4px 0 0" }}>{a.sub}</p>
      </header>

      <div style={{ marginTop: 24 }}>
        <Card><MonthGrid /></Card>
      </div>

      <div style={{ marginTop: 32 }}>
        <SectionLabel action={<Button variant="plain" size="sm" onClick={onNew}>Nowy</Button>}>Ostatnie treningi</SectionLabel>
        {a.workouts.map((w) => (
          <ListRow
            key={w.id}
            title={w.name}
            sub={`${w.date} · ${w.sets} serii · ${nf(w.volume)} kg`}
            right={
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {w.best ? <Marker tone="pr">PR</Marker> : null}
                <Icon name="caret-right" size={15} color="var(--fg-faint)" />
              </span>
            }
            onClick={() => onOpen(w)}
          />
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <Card flat>
          <SectionLabel>Ten tydzień</SectionLabel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
            <StatTile value="3" label="Treningi" delta="+1" />
            <StatTile value="39" label="Serie" delta="+4" />
            <StatTile value="13 880" unit="kg" label="Objętość" delta="+8%" />
          </div>
          <div style={{ marginTop: 14 }}>
            <LineChart points={[3200, 3600, 3480, 4200, 4380, 4510, 4820]} height={56} showAxis={false} dots={false} />
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { WorkoutsScreen });
