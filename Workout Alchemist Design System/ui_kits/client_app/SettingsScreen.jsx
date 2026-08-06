const { Card, SectionLabel, Field, Input, SegmentedControl, Switch, ListRow, Icon, Wordmark, Divider } =
  window.WorkoutAlchemistDesignSystem_381a04;

function SettingsScreen({ theme, onTheme }) {
  const a = window.APP;
  const [sex, setSex] = React.useState("Mężczyzna");
  const [units, setUnits] = React.useState("Metryczny");
  const [rest, setRest] = React.useState(true);

  return (
    <div style={{ padding: "28px var(--gutter) 140px" }}>
      <h1 className="t-title" style={{ margin: 0 }}>Ustawienia</h1>

      <div style={{ marginTop: 20 }}>
        <Card>
          <SectionLabel>Profil</SectionLabel>
          <div style={{ marginTop: 4 }}>
            <SegmentedControl value={sex} onChange={setSex} items={["Mężczyzna", "Kobieta", "Inne"]} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1 }}>
              <Field label="Waga"><Input num value={a.body.weight} suffix="kg" /></Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Wzrost"><Input num value={a.body.height} suffix="cm" /></Field>
            </div>
          </div>
          <p className="t-small" style={{ margin: "12px 0 0" }}>
            Waga i wzrost trafiają też do zakładki Progres.
          </p>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionLabel>Trening</SectionLabel>
        <ListRow title="Waga docelowa" sub={a.body.goal} right={<Icon name="caret-right" size={15} color="var(--fg-faint)" />} onClick={() => {}} />
        <ListRow title="Domyślna przerwa" sub="90 s" right={<Icon name="caret-right" size={15} color="var(--fg-faint)" />} onClick={() => {}} />
        <ListRow title="Jednostki" right={<span style={{ width: 200 }}><SegmentedControl value={units} onChange={setUnits} items={["Metryczny", "Imperialny"]} /></span>} />
        <ListRow title="Auto-start przerwy" right={<Switch checked={rest} onChange={setRest} />} />
        <ListRow title="Ciemny motyw" right={<Switch checked={theme === "dark"} onChange={(v) => onTheme(v ? "dark" : "light")} />} />
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionLabel>Dane</SectionLabel>
        <ListRow title="Eksportuj CSV" right={<Icon name="caret-right" size={15} color="var(--fg-faint)" />} onClick={() => {}} />
        <ListRow title="Usuń wszystkie dane" right={<Icon name="caret-right" size={15} color="var(--fg-faint)" />} onClick={() => {}} />
      </div>

      <Divider margin={28} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark size={11} />
        <span className="t-label">v1.0.0</span>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsScreen });
