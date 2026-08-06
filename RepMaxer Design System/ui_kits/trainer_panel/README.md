# UI kit — Panel trenera

The trainer's desktop side, stripped to the same monochrome language as the client app. No sidebar — a hairline top nav with mono caps links.

**Screens**
- `ClientsScreen.jsx` — three big mono stats, search + two filter chips, then hairline client rows (plan, last session, sessions ratio, an "uwaga" label when they've fallen behind).
- `ClientScreen.jsx` — client header with two actions, active-plan card with a volume sparkline, a flat stat column, then a Historia / Plan segmented switch. Plan view shows one card per training day.

**Interactive:** click a client row to open the profile, "← Klienci" to go back, filter chips and search are live, Historia / Plan switches the lower half. The theme button in the top-right flips light/dark.

**Deliberately absent:** the drag-and-drop plan builder, exercise library CRUD and per-set editing live in the app but are out of scope here — this kit shows the two views that establish the layout language. Ask if you want the builder next.
