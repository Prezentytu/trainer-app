# Migracja na design system Workout Alchemist + theming

## TLDR

Migrujemy portal trenera na design system Workout Alchemist (ink/bone + teal, gold tylko PR) z trójwarstwową architekturą tokenów (prymitywy → semantyka → Tailwind `@theme inline`), tak aby personalizacja motywu polegała wyłącznie na nadpisaniu warstwy semantycznej. Restyling `ui.tsx`, `AppShell` i wszystkich istniejących ekranów (w tym kreatora planu) bez zmian funkcji ani API.

## Problem

Obecna paleta (zinc + yellow w `@theme`) i font Geist nie odpowiadają makietom Workout Alchemist. Tokeny są „statyczne” (mapują się na skale Tailwind przy buildzie), więc przyszła personalizacja motywu wymagałaby rebuilda lub masowej podmiany klas. Część stron nadal używa surowych `zinc-*`/`yellow-*`. Brakuje prymitywów UI z DS (StatBlock, Tabs, Dialog, Switch, Tag…).

## Proponowane rozwiązanie

### Architektura 3 warstw

1. **Prymitywy** (`:root`) — `--ink-*`, `--bone-*`, `--teal-*`, `--gold-*`, `--clay-*` (hex z WA DS).
2. **Semantyka** (`:root`, themable) — `--background`, `--surface`, `--accent`, `--pr`, `--danger`… mapowane na prymitywy. Każdy motyw definiuje **tylko** tę warstwę pod `[data-theme="…"]`.
3. **Tailwind** (`@theme inline`) — `--color-*` wskazują na `var(--…)` z warstwy 2, więc klasy `bg-surface` / `text-accent` reagują w runtime na zmianę motywu.

Komponenty nigdy nie odwołują się do prymitywów ani surowych hexów — wyłącznie do tokenów semantycznych / klas Tailwind z `@theme`.

### Motyw startowy: Workout Alchemist

| Semantyka | Prymityw WA |
|---|---|
| `background` / `surface-sunken` | `--ink-950` |
| `surface` | `--ink-850` |
| `surface-hover` | `--ink-800` |
| `surface-active` | `--ink-700` |
| `border` | `#22262A` (`--border-subtle`) |
| `border-strong` | `#343A3B` |
| `foreground` | `--bone-100` |
| `foreground-secondary` | `--bone-300` |
| `muted-strong` | `--bone-500` (lekko jaśniej niż DS muted dla czytelności etykiet) |
| `muted` | `--bone-500` |
| `muted-faint` | `--bone-700` |
| `accent` | `--teal-500` |
| `accent-strong` | `--teal-400` |
| `accent-foreground` / `text-on-accent` | `#04120F` |
| `accent-dim` | `--teal-900` |
| `accent-border` | `--teal-700` |
| `pr` / `pr-dim` | `--gold-400` / `--gold-900` |
| `positive` / `positive-dim` | `--teal-300` / `--teal-900` |
| `success` / `success-bg` | alias `positive` (kompatybilność wsteczna) |
| `danger` / `danger-bg` / `danger-border` | clay scale |

**Zasada brandowa:** gold (`pr`) wyłącznie dla personal bests — nigdy jako primary CTA.

### Fonty

`next/font/google`: Bricolage Grotesque (`--font-display`), Instrument Sans (`--font-sans` / body), IBM Plex Mono (`--font-mono`). Liczby (serie, kg, sekundy, StatBlock) w mono.

### Kontrakt motywu (przyszła personalizacja)

Każdy motyw **musi** zdefiniować pod `[data-theme="…"]` (lub w `:root` dla domyślnego):

```
--background, --surface, --surface-sunken, --surface-hover, --surface-active,
--border, --border-strong,
--foreground, --foreground-secondary, --muted-strong, --muted, --muted-faint,
--accent, --accent-strong, --accent-foreground, --accent-dim, --accent-border,
--pr, --pr-dim, --positive, --positive-dim,
--danger, --danger-bg, --danger-border,
--success, --success-bg
```

Przełącznik UI / zapis preferencji — poza zakresem; architektura to umożliwia.

### Komponenty

Restyling + nowe w `apps/web/components/ui.tsx` (Tailwind + tokeny, nie inline styles z prototypów DS): Button, Card, Badge, IconButton, Field/inputClass, EmptyState, Avatar, StatBlock, Tag, Tabs, SegmentedControl, Switch, Dialog, ProgressRing.

### Ekrany

Restyling (bez nowych funkcji): Panel, Klienci, Profil klienta, Ćwiczenia, Plany, PlanBuilder wg makiety „WA redesign” (superserie teal, badge „Formula”, CTA korzyści, mono w podsumowaniach).

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

| Obszar | Pliki |
|---|---|
| Tokeny | `apps/web/app/globals.css` |
| Fonty / metadata | `apps/web/app/layout.tsx` |
| Prymitywy | `apps/web/components/ui.tsx` |
| Shell | `apps/web/components/AppShell.tsx` |
| Strony | `apps/web/app/**/page.tsx`, `components/plan-builder/**`, `PlanBuilder.tsx` |
| Skill | `.cursor/skills/design-system/SKILL.md` |

Wordmark: „Workout Alchemist” (display), „Alchemist” w `text-accent`. Metadata title: „Workout Alchemist”.

## Fazy implementacji

- [x] Faza 1 — spec + tokeny + fonty (`globals.css`, `layout.tsx`)
- [x] Faza 2 — biblioteka `ui.tsx` + `AppShell`
- [x] Faza 3 — restyling stron + PlanBuilder
- [x] Faza 4 — skill design-system + bramka `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| `@theme inline` — klasy Tailwind nie reagują na CSS vars | Weryfikacja wizualna + build; wartości w `@theme inline` to wyłącznie `var(--token)` |
| Masowa podmiana surowych `zinc-*`/`yellow-*` na stronach | Restyling jest w zakresie; zmiany czysto wizualne |
| Alias `success` ↔ `positive` | Oba tokeny mapowane; Badge zachowuje ton `green` → `positive` |
| Kontrast teal na ink | Używamy skali WA DS (sprawdzonej w makietach); accent-strong na hover |

## Changelog

- 2026-07-29 — utworzono spec; decyzje: motyw WA, zakres = restyling bez nowych funkcji.
- 2026-07-29 — wdrożono: tokeny 3-warstwowe, fonty WA, rozbudowa `ui.tsx`, restyling AppShell + stron + PlanBuilder; skill `design-system` zaktualizowany.
