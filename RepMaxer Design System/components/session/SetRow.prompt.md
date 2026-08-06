The logging grid: `SET | WEIGHT | REPS | ×`. No card, no borders — the grid is the structure.

```jsx
<SetRowHeader left="Ciężar (kg)" right="Powt." />
<SetRow index={1} weight="60" reps="7" onWeight={w} onReps={r} onDelete={d} />
<SetRow index={2} weight="BW" reps="8" weightSuffix="BW" />
```

Bodyweight sets show `BW` in the weight cell. Keep fields 40px tall so the row clears the 44px tap minimum.
