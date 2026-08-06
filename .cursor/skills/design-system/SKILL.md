---
name: design-system
description: Nasza paleta i system projektowy Trainer App / RepMaxer mono v2 — kolory (apps/web/app/globals.css), typografia, spacing, hierarchia wizualna. Użyj ZAWSZE przy tworzeniu nowego UI, dodawaniu kolorów, review/audycie istniejących komponentów pod kątem zgodności z paletą, albo gdy trzeba wygenerować/poprawić komponent dla światowej klasy UI.
---

# Design tokens — RepMaxer mono v2

Cichy instrument: near-black / white / greys. Emfaza = **invert fill**, nigdy hue w chrome. Kolor tylko na danych: PR / gain / loss.

> Źródło prawdy: `apps/web/app/globals.css` + ten skill. Spec: `.ai/specs/2026-08-06-mono-epic-minimalism.md`.  
> Folder `RepMaxer Design System/` = referencja specimenów (mono). Landing marketingowy używa tych samych tokenów mono v2.

## Non-negotiables

1. **Brak akcentu w chrome** — buttony, nav, ikony chrome, karty, linie wykresu = mono. Primary = `bg-invert-bg text-invert-fg` (biała pigułka).
2. **Trzy data accents** — `--pr` (★), `--gain` (▲), `--loss` (▼). Zawsze z glifem/znakiem. Nigdy sam kolor.
3. **Dwa fonty** — Instrument Sans (słowa), Geist Mono (liczby + labelki caps). Nic poniżej 12px / wagi 400.
4. **Zero cieni / gradientów / blur** — głębia = szary stopień + hairline 1px. Karty: `--surface` + `--line-faint`.
5. **Niskie kontrolki** — pole 34px, btn 38px, chip 28px; tap 44px z kontenera (ListRow / siatka).
6. **Phosphor** (web font regular) przez `components/Icon.tsx` — nie Lucide.
7. **Listy** = hairline rows na tle, nie stos kart z cieniem.

## Tokeny (skrót)

| Token | Dark | Rola |
|---|---|---|
| `background` / `--bg` | `#0B0C0D` | strona |
| `surface` | `#17191B` | karty |
| `surface-raised` / `field` | `#212427` | nav pill, pola |
| `border` / `--line-faint` | `#2B2F33` | row dividers |
| `border-strong` / `--line` | `#33373B` | krawędzie (≥3:1) |
| `foreground` | `#FFF` | tytuły |
| `foreground-secondary` / muted-strong | `#C9CED4` | body (≥4.5:1) |
| `muted` | `#9AA1A8` | labelki |
| `muted-faint` / fg-ghost | `#6E767E` | placeholdery / ticki |
| `accent` | invert white | primary fill (legacy alias) |
| `pr` / `gain` / `loss` / `danger` | gold / green / red | tylko dane (+ destrukcja) |

Light: `[data-theme="light"]` — przełącznik w `/settings` (`lib/theme.ts`, klucz `repmaxer-theme`). `prefers-contrast: more` podnosi secondary.

## Typografia

| Klasa | Font | Size / weight |
|---|---|---|
| `.t-display` | Instrument Sans | 40 / 600 |
| `.t-title` | Instrument Sans | 25 / 600 |
| `.t-heading` | Instrument Sans | 18 / 500 |
| `.t-body` | Instrument Sans | 15 / 400 |
| `.t-small` | Instrument Sans | 13 / 400 muted |
| `.t-label` | Geist Mono | 12 / 500 caps 0.1em |
| `.t-num` | Geist Mono | 700 tabular |

Liczba nad labelką: `85,5 kg` / `WAGA`.

## Prymitywy (`components/ui.tsx`)

`Button` (invert / hairline / ghost / danger), `Card` (+ `flat`), `ListRow`, `Marker`, `Badge`, `Pill`, `SegmentedControl`, `Tabs`, `Switch` (✓ w gałce), `Dialog` (mały center), `Sheet`, `StatBlock`, `IconButton`, `Field` + `inputClass`, `EmptyState`, `ErrorBanner`, `ProgressRing` (`currentColor`).

Focus: `box-shadow: var(--focus-ring)` (2px bg + 4px fg). Press: `scale(0.97)`.

## Ikony

`import { Icon } from "@/components/Icon"` — `name="search" | "dumbbell" | …`, `size={18}`, `decorative`. Aliasy angielskie w pliku. Nigdy kolorowane; `currentColor` / `--fg-muted`.

## Nav / brand

- Desktop panel trenera: **lewy sidebar** (jak Linear/Stripe) — wordmark, linki z invert gdy active, konto na dole. W kreatorze planu: wąski rail (ikony), pełny po hover.
- Mobile panel + portal: **floating pill** 20px od dołu, aktywny = invert.
- Wordmark: sam tekst (`display-caps`), bez lime tile. PWA/ikony: mono `#0B0C0D` + wordmark „RM” (RepMaxer).

## Zakazy

- Surowy `fetch`, klasy `zinc-*` / `lime-*` / hexy w komponentach.
- Lucide, emoji, cienie, backdrop-blur, gradienty w app chrome.
- Sygnalizowanie stanu samym kolorem.
- Landing i app dzielą te same tokeny mono — nie wprowadzaj osobnego hue-theme na marketing.

## Checklist przed merge UI

- [ ] Zero hue w chrome (nav/CTA/focus = invert lub hairline)
- [ ] Data accents z glifem
- [ ] Kontrast AA (tekst ≥4.5:1, hairline ≥3:1)
- [ ] Nic <12px / <400
- [ ] Karty: fill + hairline; listy: ListRow
- [ ] Phosphor przez `Icon`
- [ ] Polskie copy, zdania krótkie, bez wykrzykników
