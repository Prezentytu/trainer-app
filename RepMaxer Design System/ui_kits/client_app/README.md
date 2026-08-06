# UI kit — App klienta

The client-side tracker, rebuilt in the simplified monochrome language. Three destinations plus a full-screen logging flow.

**Screens**
- `WorkoutsScreen.jsx` — greeting, month calendar with a dot per trained day, recent-workout rows, a flat weekly summary card with a sparkline.
- `WorkoutScreen.jsx` — the logging flow. `Anuluj / Trening / Zapisz · FINISH` top bar, one `ExerciseBlock` per exercise with the four-column set grid, "+ Dodaj ćwiczenie" opening a bottom-sheet picker, and a centred confirm dialog on cancel.
- `ProgressScreen.jsx` — body-stats card, two stacked pill rows (muscle group → exercise), the single-line chart, three summary stats. Changing either pill row swaps the series.
- `SettingsScreen.jsx` — profile segmented control, numeric fields, hairline setting rows, theme switch.

**Interactive:** tap any workout row or "Nowy" to enter logging; edit weight/reps, add and delete sets, add an exercise from the sheet, FINISH lands on Progres. Pills on Progres are live. The theme switch (top-right, and in Ustawienia) flips every token between dark and light.

**Copy** stays Polish, matching the product. **Data** is fake (`data.js`).

**Abbreviated:** 3 exercises stand in for a full session; rest timers, plate maths, offline queue, exercise history detail and CSV export are represented by their entry points only.
