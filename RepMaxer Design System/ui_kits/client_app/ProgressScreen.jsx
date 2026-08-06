const { Card, SectionLabel, StatTile, Marker, Pill, PillRow, Button, LineChart } =
  window.WorkoutAlchemistDesignSystem_381a04;

function ProgressScreen() {
  const a = window.APP;
  const [group, setGroup] = React.useState("Klatka");
  const list = a.exercisesByGroup[group];
  const [exercise, setExercise] = React.useState(list[0]);
  const s = a.series[exercise] || a.series["Bench Press"];

  const pickGroup = (g) => {
    setGroup(g);
    setExercise(a.exercisesByGroup[g][0]);
  };

  return (
    <div style={{ padding: "28px var(--gutter) 140px" }}>
      <h1 className="t-title" style={{ margin: 0 }}>Progres</h1>

      <div style={{ marginTop: 20 }}>
        <Card>
          <SectionLabel action={<Button variant="plain" size="sm">Edytuj</Button>}>Ciało</SectionLabel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
            <StatTile value={a.body.weight} unit="kg" label="Waga" delta="-1,2 kg" deltaTone="gain" />
            <StatTile value={a.body.height} unit="cm" label="Wzrost" />
            <StatTile value={a.body.bmi} label="BMI" delta="-0,3" deltaTone="gain" />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
            <span className="s-pill" style={{ pointerEvents: "none" }}>{a.body.sex}</span>
            <span className="s-pill" style={{ pointerEvents: "none" }}>{a.body.units}</span>
            <span className="s-pill" style={{ pointerEvents: "none" }}>Cel: {a.body.goal}</span>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <PillRow>
          {a.groups.map((g) => (
            <Pill key={g} active={g === group} onClick={() => pickGroup(g)}>{g}</Pill>
          ))}
        </PillRow>
        <PillRow>
          {list.map((e) => (
            <Pill key={e} text active={e === exercise} onClick={() => setExercise(e)}>{e}</Pill>
          ))}
        </PillRow>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 22 }}>
        <span className="t-label">1RM · 6 tygodni</span>
        <Marker tone={s.points[s.points.length - 1] >= s.points[0] ? "gain" : "loss"}>
          {s.points[s.points.length - 1] >= s.points[0] ? "+" : ""}
          {Math.round(((s.points[s.points.length - 1] - s.points[0]) / s.points[0]) * 100)}%
        </Marker>
      </div>
      <div style={{ marginTop: 10 }}>
        <LineChart points={s.points} labels={s.labels} height={190} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
        <StatTile value={s.best} unit="kg" label="Rekord" tone="pr" center />
        <StatTile value={s.sessions} label="Sesje" center />
        <StatTile value={s.volume} unit="kg" label="Najlepsza objętość" center delta="+8%" />
      </div>
    </div>
  );
}

Object.assign(window, { ProgressScreen });
