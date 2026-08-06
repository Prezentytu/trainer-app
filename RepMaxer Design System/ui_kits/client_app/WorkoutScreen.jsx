const { TopBar, Button, IconButton, Icon, ExerciseBlock, SetRow, SetRowHeader, Sheet, Input, ListRow } =
  window.WorkoutAlchemistDesignSystem_381a04;

function WorkoutScreen({ onCancel, onFinish }) {
  const src = window.APP.session;
  const [exercises, setExercises] = React.useState(() => JSON.parse(JSON.stringify(src.exercises)));
  const [picker, setPicker] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);

  const patch = (ei, si, key, v) =>
    setExercises((xs) => xs.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, [key]: v } : s)) } : e)));
  const addSet = (ei) =>
    setExercises((xs) => xs.map((e, i) => (i === ei ? { ...e, sets: [...e.sets, { w: e.bodyweight ? "BW" : "", r: "" }] } : e)));
  const delSet = (ei, si) =>
    setExercises((xs) => xs.map((e, i) => (i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e)));

  const library = src.library.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        left={<Button variant="plain" size="sm" onClick={() => setConfirm(true)}>Anuluj</Button>}
        title="Trening"
        right={
          <>
            <Button variant="plain" size="sm">Zapisz</Button>
            <Button caps size="sm" onClick={onFinish}>Finish</Button>
          </>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "4px var(--gutter) 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
          <span className="t-label">{src.date}</span>
          <span className="t-label">{totalSets} serii</span>
        </div>

        {exercises.map((ex, ei) => (
          <ExerciseBlock
            key={ei}
            name={ex.name}
            action={
              <IconButton
                title="Usuń ćwiczenie"
                size="sm"
                onClick={() => setExercises((xs) => xs.filter((_, i) => i !== ei))}
              >
                <Icon name="trash" size={14} />
              </IconButton>
            }
            onAddSet={() => addSet(ei)}
          >
            <SetRowHeader left={ex.bodyweight ? "Ciężar" : "Ciężar (kg)"} right="Powt." />
            {ex.sets.map((s, si) => (
              <SetRow
                key={si}
                index={si + 1}
                weight={s.w}
                reps={s.r}
                weightSuffix={ex.bodyweight ? "BW" : "kg"}
                onWeight={(v) => patch(ei, si, "w", v)}
                onReps={(v) => patch(ei, si, "r", v)}
                onDelete={() => delSet(ei, si)}
              />
            ))}
          </ExerciseBlock>
        ))}

        <button type="button" className="s-addset" style={{ paddingTop: 20 }} onClick={() => setPicker(true)}>
          + Dodaj ćwiczenie
        </button>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Dodaj ćwiczenie">
        <Input value={search} onChange={setSearch} placeholder="Szukaj…" />
        <div style={{ marginTop: 8, maxHeight: 260, overflowY: "auto" }}>
          {library.map((e) => (
            <ListRow
              key={e.name}
              title={e.name}
              sub={e.group}
              right={<Icon name="plus" size={15} color="var(--fg-faint)" />}
              onClick={() => {
                setExercises((xs) => [...xs, { name: e.name, bodyweight: false, sets: [{ w: "", r: "" }] }]);
                setPicker(false);
                setSearch("");
              }}
            />
          ))}
        </div>
      </Sheet>

      <Sheet
        center
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Odrzucić trening?"
        footer={
          <>
            <Button variant="outline" full onClick={() => setConfirm(false)}>Wróć</Button>
            <Button variant="danger" full onClick={onCancel}>Odrzuć</Button>
          </>
        }
      >
        <p className="t-small" style={{ margin: 0 }}>Serie z tej sesji nie zostaną zapisane.</p>
      </Sheet>
    </div>
  );
}

Object.assign(window, { WorkoutScreen });
