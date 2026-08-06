Phosphor glyph rendered as a web font — an icon is text, so it inherits `currentColor` and scales with `font-size`.

Load the stylesheet once per page:

```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
```

```jsx
<Icon name="barbell" size={20} />
<Icon name="trend-up" />
<Icon name="caret-right" size={16} color="var(--fg-faint)" />
```

Phosphor replaced Lucide: its slightly rounded terminals and geometric construction read as a distinct hand rather than the generic thin-stroke set every tracker ships with. Use `regular` weight; `light` only for glyphs above 24px. 18px inline in rows, 20px in nav, 16px for chevrons. Never coloured, never below `--fg-muted`, and every icon-only control still needs a `title`.
