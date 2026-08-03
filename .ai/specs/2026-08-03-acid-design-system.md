# Acid Design System — re-theme Workout Alchemist

## TLDR

Re-theme całego frontu z teal (stary WA) na **Acid**: lime `#C6F135` na atramentowej zieleni, brutalistyczna Archivo 900 UPPERCASE, Space Grotesk body, IBM Plex Mono dla liczb. Podmiana warstwy prymitywów w `globals.css` przemalowuje aplikację automatycznie; landing i kluczowe ekrany produktu dostają ręczne dopieszczenie w języku Acid.

## Problem

Art direction „Acid Lab / 2a” zastępuje dotychczasowy teal. Katalog `Workout Alchemist Design System/` w repo nadal niesie starą paletę teal — nie jest źródłem prawdy. Referencja: `Landing page - Acid Lab.dc.html` (lime, Archivo, terminal session tracker, scanline).

## Proponowane rozwiązanie

1. **Fundament tokenów** — warstwa 1: `--lime-*` zamiast `--teal-*`; warstwa 2 (nazwy ról) bez zmian → zero zmian w klasach Tailwind komponentów.
2. **Fonty** — Archivo (display) + Space Grotesk (body) + IBM Plex Mono przez `next/font`.
3. **Prymitywy `ui.tsx`** — Button glow CTA, Card pending (dashed), Field mono caps, Dialog radius 24.
4. **Landing** — przebudowa wizualna w duchu referencji (terminal, stroke text, CtaBand na lime); **bez** fałszywego social proofu (marquee klubów, cytat „Dana Reyes”).
5. **Ekrany produktu** — AppShell, TrainerDashboard, SessionLogger, portal, plan-builder.

### Mapa tokenów (skrót)

| Rola | Acid |
|---|---|
| background | `#0B0D08` |
| surface | `#10140C` |
| accent | `#C6F135` |
| accent-foreground | `#0B0D08` |
| positive | `#DBF76B` |
| pr (gold) | `#E8BB4F` |
| danger | `#E06A4A` |
| border | `#1E2418` |
| border-strong | `#2C3325` |

### Casing

- Landing + wordmark + nazwy ćwiczeń w loggerze: UPPERCASE (`display-caps`).
- Eyebrowy: mono ALL-CAPS + opcjonalny `///`.
- Tytuły stron panelu/portalu: sentence case.

### Świadomie pominięte z referencji

- Marquee z wymyślonymi klubami.
- Cytat testimonial „Dana Reyes”.
- Fałszywe metryki typu „2,400 coaches” — zastąpione faktami produktu (6 min, 0 aplikacji, 1 link).

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

- Tokeny: `apps/web/app/globals.css`
- Fonty: `apps/web/app/layout.tsx`
- Prymitywy: `apps/web/components/ui.tsx`
- Lustra: `lib/clerkAppearance.ts`, `opengraph-image.tsx`, manifesty PWA, `Wordmark.tsx`
- Landing: `components/landing/*`
- Produkt: `AppShell`, `TrainerDashboard`, `SessionLogger`, `RestTimer`, portal, plan-builder

## Fazy implementacji

- [x] Faza 1 — fundament (tokeny, fonty, ui.tsx, lustra)
- [x] Faza 2 — landing Acid
- [x] Faza 3 — ekrany produktu
- [x] Faza 4 — docs + bramka

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Diakrytyki PL w Archivo/Space Grotesk | subsets `latin-ext`; fallback body → Instrument Sans jeśli brak pokrycia |
| `--positive` ≈ `--accent` (oba lime) | rozróżnienie jasnością (`lime-300` vs `lime-500`) |
| Kontrast bone-500 na ink | body ≥14px; tekst na lime zawsze `--ink-950` |

## Changelog

- 2026-08-03 — utworzono i wdrożono Acid Design System.
- 2026-08-03 — **Hierarchy retune**: near-neutral elevation ladder (6 stopni), lime budget ≤3%, retired `--glow-cta` / `--texture-scan` / `--glow-pr`, eyebrows → muted, active nav = tint+bar+primary text, PR = quiet tint+border. Test: ekran czytelny bez akcentu.
