---
name: design-system
description: Nasza paleta i system projektowy Trainer App / Workout Alchemist — kolory (apps/web/app/globals.css), typografia, spacing, hierarchia wizualna. Użyj ZAWSZE przy tworzeniu nowego UI, dodawaniu kolorów, review/audycie istniejących komponentów pod kątem zgodności z paletą, albo gdy trzeba wygenerować/poprawić komponent dla światowej klasy UI.
---

# Nasza paleta (design tokens) — Workout Alchemist

Portal ma jeden, ciemny motyw startowy (Workout Alchemist). Kolory żyją w **trzech warstwach** — dzięki temu personalizacja motywu to nadpisanie ~15 zmiennych semantycznych, bez zmian w komponentach.

## Architektura 3 warstw

1. **Prymitywy** (`:root` w [apps/web/app/globals.css](apps/web/app/globals.css)): `--ink-*`, `--bone-*`, `--teal-*`, `--gold-*`, `--clay-*`. Surowy materiał — **nigdy** w komponentach.
2. **Semantyka** (`:root`, themable): `--background`, `--surface`, `--accent`, `--pr`… — nazwy po **roli**. Każdy motyw nadpisuje **tylko** tę warstwę (np. `[data-theme="…"]`).
3. **Tailwind** (`@theme inline`): `--color-*` / `--font-*` wskazują na `var(--…)` z warstwy 2. Klasy `bg-surface`, `text-accent` reagują w runtime na zmianę motywu.

Źródło wzorca: katalog `Workout Alchemist Design System/tokens/`. Spec: `.ai/specs/2026-07-29-wa-design-system-theming.md`.

## Proporcja brandowa

~**90%** neutrale (ink/bone) / ~**8%** teal (akcje, focus, active nav) / ~**2%** gold+clay.

**Gold (`pr`) wyłącznie dla rekordów osobistych (PR)** — nigdy jako primary CTA ani aktywny stan nawigacji.

## Tabela tokenów semantycznych

| Token | Motyw WA (prymityw) | Klasy Tailwind | Rola |
|---|---|---|---|
| `background` | `--ink-950` | `bg-background` | tło strony |
| `surface` | `--ink-850` | `bg-surface` | karty (`Card`), panele |
| `surface-sunken` | `--ink-950` | `bg-surface-sunken` | zagnieżdżone panele, inputy |
| `surface-hover` | `--ink-800` | `bg-surface-hover` | hover, tła pomocnicze |
| `surface-active` | `--ink-700` | `bg-surface-active` | aktywne tło segmentów / badge |
| `border` | `#22262A` | `border-border` | domyślne obramowanie |
| `border-strong` | `#343A3B` | `border-border-strong` | inputy, mocniejsze separatory |
| `foreground` | `--bone-100` | `text-foreground` | główny tekst |
| `foreground-secondary` | `--bone-300` | `text-foreground-secondary` | nawigacja, ghost button |
| `muted-strong` | `--bone-300` | `text-muted-strong` | etykiety, podtytuły |
| `muted` | `--bone-500` | `text-muted` | meta, captions, „Ładowanie…” |
| `muted-faint` | `--bone-700` | `text-muted-faint` | uchwyty drag, dekoracje |
| `accent` | `--teal-500` | `bg-accent`, `text-accent` | marka / CTA / stan aktywny |
| `accent-strong` | `--teal-400` | `text-accent-strong` | hover akcentu |
| `accent-foreground` | `#04120F` | `text-accent-foreground` | tekst na teal |
| `accent-dim` | `--teal-900` | `bg-accent-dim` | tło active nav / badge accent |
| `accent-border` | `--teal-700` | `border-accent-border` | obramowanie accent |
| `pr` | `--gold-400` | `text-pr`, `bg-pr` | **tylko personal bests** |
| `pr-dim` | `--gold-900` | `bg-pr-dim` | tło badge PR |
| `positive` | `--teal-300` | `text-positive` | sukces / on-track |
| `positive-dim` | `--teal-900` | `bg-positive-dim` | tło badge positive |
| `danger` | `--clay-500` | `text-danger` | błąd / destrukcja |
| `danger-bg` | `--clay-900` | `bg-danger-bg` | tło banera / danger button |
| `danger-border` | `--clay-600` | `border-danger-border` | obramowanie danger |
| `success` / `success-bg` | alias `positive` | `text-success` | kompatybilność wsteczna Badge `green` |

## Kontrakt motywu (personalizacja)

Każdy motyw **musi** zdefiniować pod `[data-theme="…"]` (lub w `:root` dla domyślnego) wszystkie zmienne z warstwy 2 wymienione w specu. Przełącznik UI / zapis preferencji — osobne zadanie; architektura już to umożliwia (`data-theme` na `<html>`).

## Twarda zasada

**Nigdy nie pisz** `bg-zinc-*`, `text-yellow-*`, `bg-teal-*`, `text-gold-*`, surowych hexów ani prymitywów `--ink-*` / `--teal-*` **w komponentach**. Zawsze token semantyczny. Brakująca rola → dodaj token do `globals.css`, nie omijaj systemu.

Wyjątek: sam `globals.css` i dokumentacja.

## Fonty

| Rola | Font | Klasa |
|---|---|---|
| Display / nagłówki / wordmark | Bricolage Grotesque | `font-display` |
| Body / UI | Instrument Sans | `font-sans` (domyślny) |
| Liczby (serie, kg, sekundy, StatBlock) | IBM Plex Mono | `font-mono` + `tabular-nums` |

Ładowane w `apps/web/app/layout.tsx` przez `next/font/google`.

## Typografia

Hierarchię buduj **wagą i kolorem**, nie skokami rozmiaru:

| Rola | Klasa | Waga |
|---|---|---|
| Micro / meta uppercase | `text-xs` + `tracking-[0.08em]` | `font-semibold` |
| Body / etykiety / przyciski | `text-sm` | `font-normal` / `font-medium` |
| Nazwa ćwiczenia / dnia | `text-sm font-medium` lub `text-base` | `font-medium` |
| Nagłówek karty | `font-display text-lg` | `font-semibold` |
| Tytuł strony (`PageHeader`) | `font-display text-xl sm:text-2xl` | `font-bold` |

Zasady:
- Maks. 3 wagi w UI: `normal` / `medium` / `semibold`. `bold` tylko h1 i wordmark.
- Zero arbitralnych rozmiarów (`text-[11px]`).
- ALL-CAPS tylko na tiny labels (1–3 słowa) z `tracking-[0.08em]`.
- Liczby zawsze `font-mono tabular-nums`.

## Spacing — rytm 8px

| Krok | Klasy | Użycie |
|---|---|---|
| 4px | `gap-1`, `p-1` | mikro |
| 8px | `gap-2`, `p-2` | wewnątrz komponentu |
| 12px | `gap-3`, `p-3` | pola formularza |
| 16px | `gap-4`, `p-4` | padding karty |
| 24px | `mb-6`, `gap-6` | pod-sekcje |
| 32px | `mb-8`, `p-8` | sekcje / main |

## Border radius

- `rounded-[10px]` / zbliżone do `--radius-md` — interaktywne (Button, IconButton, inputy, wiersze).
- `rounded-xl` (16px) — kontenery (`Card`).
- `rounded-full` — Badge, Pill, Avatar.

## Hierarchia wizualna (3 poziomy)

1. **Primary** — tytuł strony, główny CTA. Max 1–2 na ekran.
2. **Secondary** — nagłówki kart, kluczowe liczby (mono).
3. **Tertiary** — etykiety, meta, captions.

## Prymitywy UI

Źródło: [apps/web/components/ui.tsx](apps/web/components/ui.tsx) — `PageHeader`, `Card` (eyebrow/title/meta/selected), `Button` (primary/secondary/ghost/danger, sm/md/lg), `Field` + `inputClass`, `Badge` (neutral/accent/positive/danger/pr + aliasy yellow/green/red), `Pill`, `IconButton`, `Avatar`, `StatBlock`, `Tag`, `Tabs`, `SegmentedControl`, `Switch`, `Dialog`, `ProgressRing`, `EmptyState`, `ErrorBanner`, `useUndoToast`, `formatRest`.

## Prompt do generowania / audytu UI

```
Jesteś senior frontend architektem współpracującym z projektantem światowej klasy.
Pracujesz w Trainer App / Workout Alchemist (Next.js 16 + Tailwind 4, ciemny motyw WA, UI po polsku).

<design_tokens>
Źródło: apps/web/app/globals.css (prymitywy + semantyka + @theme inline).
Komponenty używają WYŁĄCZNIE tokenów semantycznych:
background, surface, surface-sunken, surface-hover, surface-active,
border, border-strong,
foreground, foreground-secondary, muted-strong, muted, muted-faint,
accent, accent-strong, accent-foreground, accent-dim, accent-border,
pr, pr-dim, positive, positive-dim,
danger, danger-bg, danger-border, success, success-bg.
Gold (pr) TYLKO dla personal bests. Proporcja ~90/8/2.
Fonty: font-display (Bricolage), font-sans (Instrument), font-mono (Plex Mono dla liczb).
</design_tokens>

<design_scale>
Typografia: text-xs → text-sm → text-lg → text-xl/2xl; bold tylko h1/wordmark.
Liczby: font-mono tabular-nums.
Spacing: 4/8/12/16/24/32px.
Radius: ~10px interaktywne, xl kontenery, full okrągłe.
Hierarchia: 3 poziomy.
</design_scale>

<component_spec>
Zadanie: {{opisz co budujesz albo które pliki audytujesz}}.
Wymagania:
- Zero surowych zinc/yellow/teal/gold/hex — wyłącznie tokeny.
- Reużyj prymitywy z apps/web/components/ui.tsx.
- Mobile-first (skill responsive-ui); nazwy nie ucinane.
</component_spec>
```

## Powiązane

- Responsywność: skill `responsive-ui`.
- Domenowe UX: skill `fitness-ui-ux`.
- CRO / psychologia: skill `senior-ux-cro`.
- Spec themingu: `.ai/specs/2026-07-29-wa-design-system-theming.md`.
