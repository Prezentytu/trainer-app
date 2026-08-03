---
name: design-system
description: Nasza paleta i system projektowy Trainer App / Workout Alchemist Acid — kolory (apps/web/app/globals.css), typografia, spacing, hierarchia wizualna. Użyj ZAWSZE przy tworzeniu nowego UI, dodawaniu kolorów, review/audycie istniejących komponentów pod kątem zgodności z paletą, albo gdy trzeba wygenerować/poprawić komponent dla światowej klasy UI.
---

# Nasza paleta (design tokens) — Workout Alchemist Acid

Portal ma jeden, ciemny motyw **Acid**. Kolory żyją w **trzech warstwach**. Hierarchia wynika ze **struktury** (elevation + text ramp), nie z jasności ani glowów.

> Katalog `Workout Alchemist Design System/` w root repo to **legacy teal** — nie jest źródłem prawdy. Prawda: `apps/web/app/globals.css` + ten skill. Spec: `.ai/specs/2026-08-03-acid-design-system.md`.

## HIERARCHY — pierwsza zasada

Każdy ekran musi być czytelny **po całkowitym usunięciu akcentu**. Lime tylko mówi, gdzie kliknąć dalej.

| Poziom | Co | Token / forma |
|---|---|---|
| 01 Primary action | 1 na region | lime fill, `text-accent-foreground` |
| 02 Titles | Archivo | `text-foreground` — **bez koloru** |
| 03 Body / row labels | bulk UI | `text-foreground-secondary` |
| 04 Eyebrows / meta / units | mono caps | `text-muted` — **nigdy lime** |
| 05 List numbers / counters | dekoracja | `text-muted-faint` |

**Lime budget ≤3%.** Dozwolone: fill CTA, focus ring, active-nav tint + 2px bar, progress/completed fill, linki (`text-accent-text`). Zakazane: eyebrows, labels, list numbers, inactive icons, headings, stats, outer glow. Jeśli dwa elementy lime widać naraz — jeden jest zbędny.

**Elevation:** `surface-sunken` → `background` → `surface-raised` → `surface` (card) → `surface-hover` → `surface-active`. Max 3 stopnie na ekran. Karta oddziela się wartością + 1px `border`, nie glowem.

**No blooms:** `--glow-cta` i `--texture-scan` = `none`. `--glow-accent` tylko jako focus ring.

## Architektura 3 warstw

1. **Prymitywy** (`:root`): `--ink-*` (near-neutral), `--bone-*`, `--lime-*`, `--gold-*`, `--clay-*`.
2. **Semantyka**: `--background`, `--surface`, `--accent`, `--accent-text`, `--pr`…
3. **Tailwind** (`@theme inline`): klasy `bg-surface`, `text-accent`…

## Proporcja brandowa

~**95%** neutrale / ~**3%** lime / ~**2%** gold+clay.

**Gold (`pr`)** wyłącznie PR — cichy tint + `border-pr-border`, nigdy świecąca pigułka.

**Active nav:** quiet `bg-accent-dim` + 2px lime bar + `text-foreground` (nie lime text).

## Tabela tokenów semantycznych

| Token | Motyw Acid | Klasy Tailwind | Rola |
|---|---|---|---|
| `surface-sunken` | `#080908` | `bg-surface-sunken` | wells / inputy (najgłębiej) |
| `background` | `#0C0D0C` | `bg-background` | tło strony |
| `surface-raised` | `#121312` | `bg-surface-raised` | warstwa między tłem a kartą |
| `surface` | `#1A1B1A` | `bg-surface` | karty |
| `surface-hover` | `#222322` | `bg-surface-hover` | hover |
| `surface-active` | `#2C2E2C` | `bg-surface-active` | active / completed row |
| `border` | `#2A2C2A` | `border-border` | widoczne obramowanie karty |
| `border-strong` | `#3A3C3A` | `border-border-strong` | inputy, dashed pending |
| `foreground` | `#F2F4EC` | `text-foreground` | tytuły, aktywny nav |
| `foreground-secondary` | `#C8CDC0` | `text-foreground-secondary` | body / row labels |
| `muted` | `#9AA193` | `text-muted` | eyebrows, meta, units |
| `muted-faint` | `#6E7566` | `text-muted-faint` | dekoracje / numery list |
| `accent` | `#C6F135` | `bg-accent` | **tylko fill** CTA / progress |
| `accent-text` | `#C3E05A` | `text-accent-text` | **jedyny** lime jako atrament (linki) |
| `accent-foreground` | `#0C0D0C` | `text-accent-foreground` | tekst na lime fill |
| `accent-dim` | `#161A10` | `bg-accent-dim` | cichy tint active nav |
| `accent-border` | `#2A3014` | `border-accent-border` | quiet accent border |
| `pr` | `#E8BB4F` | `text-pr` | **tylko personal bests** |
| `pr-dim` / `pr-border` | gold quiet | `bg-pr-dim`, `border-pr-border` | PR tint + border |
| `positive` | bone-300 | `text-positive` | on-track (cichy, nie drugi lime) |
| `danger` | `#E06A4A` | `text-danger` | destrukcja / missed |

## Efekty i utilities Acid

| Token / klasa | Użycie |
|---|---|
| `--glow-accent` | **jedyny** glow — focus-visible ring |
| `--glow-cta` / `--texture-scan` / `--glow-pr` | `none` (retired) |
| `--radius-well` `6px` | tabele serii / terminal wells |
| `.display-caps` | Archivo 900 + UPPERCASE + tracking-display |
| `.eyebrow` | mono caps + `text-muted` (nigdy lime); opcjonalnie `///` |
| `.rule-dashed` | separator dashed `--border-strong` |

## Twarda zasada

**Nigdy nie pisz** `bg-zinc-*`, `text-yellow-*`, `bg-teal-*`, `bg-lime-*`, `text-gold-*`, surowych hexów ani prymitywów `--ink-*` / `--lime-*` **w komponentach**. Zawsze token semantyczny. Brakująca rola → dodaj token do `globals.css`, nie omijaj systemu.

Wyjątek: sam `globals.css`, lustra SDK (`clerkAppearance.ts`, OG image, manifesty) i dokumentacja.

## Fonty

| Rola | Font | Klasa |
|---|---|---|
| Display / nagłówki / wordmark | Archivo 700–900 | `font-display` / `.display-caps` |
| Body / UI | Space Grotesk | `font-sans` (domyślny) |
| Liczby (serie, kg, sekundy, StatBlock) | IBM Plex Mono | `font-mono` + `tabular-nums` |

Ładowane w `apps/web/app/layout.tsx` przez `next/font/google` (`latin` + `latin-ext`).

## Typografia i casing

| Rola | Klasa | Waga |
|---|---|---|
| Micro / meta uppercase | `font-mono text-xs tracking-caps uppercase` / `.eyebrow` | `font-medium` |
| Body / etykiety | `text-sm` | `font-normal` / `font-medium` |
| Nazwa ćwiczenia (logger, landing brand) | `.display-caps` | 900 |
| Nagłówek karty | `font-display text-lg font-bold` | bold |
| Tytuł strony (`PageHeader`) | `font-display text-xl sm:text-2xl font-bold` | bold — **sentence case** |

### Zasady casingu Acid

- **UPPERCASE** tylko: landing headings, wordmark, nazwy ćwiczeń w SessionLoggerze, mikro-etykiety mono (`SERIE`, `PRZERWA`, `TYDZIEŃ 3`).
- Eyebrowy mogą mieć prefiks `///` (`Card eyebrowMark`, klasa `.eyebrow`).
- Tytuły stron panelu i portalu: **sentence case**.
- Body i kontrolki: sentence case („Start workout” → PL: „Rozpocznij trening”).
- Liczby zawsze `font-mono tabular-nums`. Zero emoji; Unicode tylko `×` i `·`.

## Spacing — rytm 4px

| Krok | Klasy | Użycie |
|---|---|---|
| 4px | `gap-1`, `p-1` | mikro |
| 8px | `gap-2`, `p-2` | wewnątrz komponentu |
| 12px | `gap-3`, `p-3` | pola formularza |
| 16–24px | `p-4`–`p-6` | padding karty (`Card` = `p-5`/`p-6`) |
| 20px | gutter mobile | |
| 32px | `mb-8`, `p-8` | sekcje / main |

Tap targets ≥ 44px.

## Border radius

- `rounded-[10px]` / `--radius-md` — interaktywne (Button, IconButton, inputy).
- `rounded-xl` (16px) — kontenery (`Card`).
- `rounded-3xl` / `--radius-xl` (24px) — arkusze Dialog.
- `rounded-[var(--radius-pill)]` — Badge, Pill.
- `--radius-well` (6px) — tabele serii / terminal.

## Motion

120ms / 220ms, `--ease-out`. Press: `scale(0.98)`. Bez bounce. Timery/progress animują się ciągle. `prefers-reduced-motion` wyłącza scanline i tick.

## Hierarchia wizualna (3 poziomy)

1. **Primary** — tytuł strony, główny CTA. Max 1–2 na ekran.
2. **Secondary** — nagłówki kart, kluczowe liczby (mono).
3. **Tertiary** — etykiety, meta, captions.

## Prymitywy UI

Źródło: [apps/web/components/ui.tsx](apps/web/components/ui.tsx) — `PageHeader`, `Card` (eyebrow/eyebrowMark/title/meta/selected/pending), `Button` (primary/secondary/ghost/danger, sm/md/lg, `glow`), `Field` + `inputClass`, `Badge`, `Pill`, `IconButton`, `Avatar`, `StatBlock`, `Tag`, `Tabs`, `SegmentedControl`, `Switch`, `Dialog`, `ProgressRing`, `EmptyState`, `ErrorBanner`, `useUndoToast`, `formatRest`.

Wordmark: [apps/web/components/Wordmark.tsx](apps/web/components/Wordmark.tsx) — lime block + Archivo 900 UPPERCASE; nigdy rysowanego logo.

## Tone of voice (UX writing)

Głos: **spokojny, dokładny coach**. Druga osoba. Liczby mówią. Bez wykrzykników, hype i emoji.

| Typ | Zasada | Dobrze | Źle |
|---|---|---|---|
| CTA | czasownik + rezultat, 1–4 słowa | „Dodaj klienta”, „Utwórz plan” | „OK”, „Potwierdź!” |
| Błąd | co się stało + jak naprawić | „Ćwiczenie jest w planie — najpierw usuń je z planów.” | „Error 409” |
| Empty | instruuje, nie przeprasza | „Brak planu. Zbuduj z formuły albo od zera.” | „Ups, nic tu nie ma 😅” |
| PR | gold tylko przy prawdziwym rekordzie | „★ Personal best” | „Super wynik!!!” |

## Prompt do generowania / audytu UI

```
Jesteś senior frontend architektem współpracującym z projektantem światowej klasy.
Pracujesz w Trainer App / Workout Alchemist Acid (Next.js 16 + Tailwind 4, ciemny motyw Acid, UI po polsku).

<design_tokens>
Źródło: apps/web/app/globals.css (prymitywy + semantyka + @theme inline).
Komponenty używają WYŁĄCZNIE tokenów semantycznych.
Gold (pr) TYLKO dla personal bests. Proporcja ~90/8/2. Jeden lime CTA na region.
Fonty: font-display (Archivo), font-sans (Space Grotesk), font-mono (Plex Mono).
Utilities: .display-caps, .eyebrow (///), .texture-scan, pending dashed Card.
</design_tokens>
```

## Powiązane

- Responsywność: skill `responsive-ui`.
- Domenowe UX: skill `fitness-ui-ux`.
- CRO / psychologia: skill `senior-ux-cro`.
- Spec Acid: `.ai/specs/2026-08-03-acid-design-system.md`.
