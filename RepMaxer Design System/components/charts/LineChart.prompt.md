One white polyline on nothing. Right-hand value ticks and a sparse date axis in mono; no grid, no fill, no second series.

```jsx
<LineChart points={[48, 52, 66, 72, 68, 80]} labels={["9. Mar", "16. Mar", "23. Mar"]} height={180} />
<LineChart points={weekly} height={64} showAxis={false} dots={false} />
```

Sparkline mode (`showAxis={false} dots={false}`) is fine inside a list row.
