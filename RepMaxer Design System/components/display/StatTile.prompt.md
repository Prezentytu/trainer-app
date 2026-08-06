Number first, label under it — the system's only way to show a metric. `Marker` is the same colour logic as a standalone badge for rows.

```jsx
<StatTile value="85,5" unit="kg" label="Waga" delta="-1,2 kg" />
<StatTile value="132" unit="kg" label="Rekord — przysiad" tone="pr" />
<StatTile value="4 820" unit="kg" label="Objętość" delta="+8%" />

<Marker tone="pr">PR</Marker>
<Marker tone="gain">+2,5 kg</Marker>
<Marker tone="loss">-9 dni</Marker>
```

Three accents exist and only here: **gold** for a personal record, **green** for an improving number, **red** for a declining one.

Direction and valence are separate channels. The **arrow follows the number's sign** (`-1,2 kg` always gets ▼), while **`deltaTone` sets the colour only** — so a cut renders a *green* ▼ and the glyph never contradicts the minus beside it. Without `deltaTone` the colour is inferred from the sign. Unsigned markers ("PR", "uwaga") fall back to their tone's glyph (★ ▼ –).

Every marker carries a glyph and its sign, so meaning survives colour-blindness and `forced-colors`. Never colour a button, a nav item, an icon in chrome, or a surface.
