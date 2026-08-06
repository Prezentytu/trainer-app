Borderless 40px field on a `--field` grey well. Focus draws a 1px inset hairline — never a coloured ring.

```jsx
<Input value={name} onChange={setName} placeholder="Nazwa" />
<Input num value="85,5" suffix="kg" ariaLabel="waga" />
```

Numbers use decimal comma (pl-PL) and thin-space thousands: `1 280 kg`.
