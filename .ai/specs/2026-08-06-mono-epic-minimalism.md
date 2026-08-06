# Redesign mono — epic minimalism (Workout Alchemist DS v2)

## TLDR

Migracja panelu trenera, portalu klienta i auth z motywu Acid (lime chrome) na monochromatyczny design system: near-black / white / greys, emfaza przez invert fill, kolor tylko na danych (PR / gain / loss). Dwa fonty (Instrument Sans + Geist Mono), Phosphor zamiast Lucide, zero cieni/blur/gradientów. Landing zostaje w Acid za guardem do osobnego kroku. Tokeny light przygotowane, bez przełącznika.

## Problem

Obecny UI (Acid) używa lime w chrome (nav, CTA, focus, tabs, switch, progress), trzech fontów, cieni i blurów. Design system v2 odrzuca to na rzecz gęstego, czytelnego minimalizmu w stylu „quiet instrument” — z poprawioną kontrastowością względem zbyt dosłownego passu Styrka.

## Proponowane rozwiązanie

1. **Tokeny** — nowa rampa w `globals.css`; istniejące nazwy semantyczne (`--accent` → invert white, `--positive` → gain) mapowane tak, by większość klas Tailwind odwróciła się bez masowego grepu.
2. **Landing-guard** — klasa `.theme-acid` na root landingu przywraca stare wartości Acid; aplikacja i auth siedzą na mono `:root`.
3. **Fonty** — Instrument Sans + Geist Mono przez `next/font/google`.
4. **Prymitywy** — `ui.tsx`: Button invert, ListRow, Marker, niskie kontrolki, focus two-tone, Sheet.
5. **Ikony** — Phosphor web font + wrapper `Icon`; usunięcie `lucide-react`.
6. **Nav/brand** — top nav desktop, floating pill bottom nav, wordmark typograficzny, PWA mono.
7. **Ekrany + wykresy** — hairline rows, data accents z glifami, charty mono.

Bez zmian modelu danych / API.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

- Tokeny: `apps/web/app/globals.css`
- Fonty: `apps/web/app/layout.tsx`
- Prymitywy: `apps/web/components/ui.tsx`, nowy `components/Icon.tsx`
- Nav: `AppShell.tsx`, `portal/PortalBottomNav.tsx`
- Brand: `Wordmark.tsx`, `lib/brandMark.tsx`, `lib/clerkAppearance.ts`
- Ekrany: dashboard, klienci, plany, ćwiczenia, SessionLogger, portal, auth
- Wykresy: `charts/LineChart.tsx`, sparklines, `WeeklyActivityBar`

## Fazy implementacji

- [x] Faza 0 — spec
- [x] Faza 1 — tokeny + fonty + landing-guard
- [x] Faza 2 — prymitywy UI + Icon/Phosphor
- [x] Faza 3 — nav + brand
- [x] Faza 4 — ekrany + wykresy
- [x] Faza 5 — walidacja (`./scripts/check.sh`)

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Landing traci lime po zmianie `:root` | `.theme-acid` z pełnym zestawem starych tokenów |
| Klasy `text-accent` na linkach stają się białe | Linki: underline + `--fg`; CTA i tak mają być invert |
| Lucide w wielu plikach | Wrapper aliasów + systematyczna wymiana |
| Geist Mono niedostępny w next/font | Fallback CDN / sprawdzenie API Next 16 |
| Regresja tap targets przy niskich kontrolkach | min-h 44px na ListRow / komórkach siatki |

## Changelog

- 2026-08-06 — utworzono spec; decyzje: app-first (landing później), tokeny light gotowe bez przełącznika.
- 2026-08-06 — wdrożono: `globals.css` mono + `.theme-acid`, Instrument Sans/Geist Mono, `ui.tsx` + `Icon`, top/floating nav, brand/Clerk/PWA mono, wykresy, usunięte lucide; `./scripts/check.sh` zielony.
