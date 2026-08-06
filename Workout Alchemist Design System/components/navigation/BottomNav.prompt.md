Floating pill nav, three or four destinations, centred and detached from the screen edge.

```jsx
<BottomNav value={tab} onChange={setTab} items={[
  { value: "workouts", label: "Workouts", icon: <Icon name="person-standing" /> },
  { value: "progress", label: "Progress", icon: <Icon name="trending-up" /> },
  { value: "settings", label: "Settings", icon: <Icon name="settings" /> },
]} />
```

Active tab is a lighter grey fill. Never a colour, never a badge count.
