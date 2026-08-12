# Portal „Dziś" — ćwiczenia jako hero

## TLDR

Na ekranie głównym portalu klienta (`/portal/{token}`) lista dzisiejszych ćwiczeń jest zawsze widoczna — także gdy sesja jest w toku (z postępem per ćwiczenie). Check-in zwija się do kompaktowego wiersza poniżej foldu. Zero zmian API/backendu.

## Problem

Klient wchodzi na siłownię, otwiera apkę i chce wiedzieć **jakie ćwiczenia będzie robił**. Dziś lista znika przy `inProgressSession` (`today && !fresh`), a pełna karta check-inu zajmuje ~40% ekranu i konkuruje z treningiem. Benchmarki (Gravitus, Styrka, Hevy/Strong): hero = dzisiejszy trening z ćwiczeniami.

## Proponowane rozwiązanie

1. **Lista zawsze** — bez sesji: `today.day.items`; z sesją w toku: `SessionDetail.exercises` (fetch `getSession`) z markerami ✓ / `2/4` / schemat planu. Fallback na plan do czasu fetchu.
2. **Meta-linia** — `N ćwiczeń · ~X min` (przed startem) albo `X/Y serii` (w toku).
3. **Check-in disclosure** — zwinięty wiersz „Jak się masz"; tap rozwija `CheckInCard` w miejscu.
4. Sticky CTA, pasek tygodnia, header, stale session — bez zmian.

## Model danych

Bez zmian. Wykorzystujemy istniejące: `PortalHome`, `PlanItem`, `SessionDetail`, `LoggedExercise`, `LoggedSet`.

## Kontrakt API

Bez nowych endpointów. Używamy:

| Metoda | Ścieżka | Użycie |
|---|---|---|
| GET | `/api/portal/{token}/home?today=` | jak dziś |
| GET | `/api/portal/{token}/sessions/{id}` | szczegóły sesji w toku (lista + completed) |

## UI

- [`apps/web/app/portal/[token]/page.tsx`](apps/web/app/portal/[token]/page.tsx) — fetch sesji, lista z markerami, meta-linia, disclosure check-inu.
- [`apps/web/components/portal/CheckInCard.tsx`](apps/web/components/portal/CheckInCard.tsx) — wariant zwijany (`defaultCollapsed`).

Hierarchia: header → tydzień → (stale) → hero trening + lista → fold → check-in zwinięty → ankieta/PWA → sticky CTA.

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — fetch `SessionDetail` + lista zawsze + meta-linia
- [x] Faza 3 — CheckInCard disclosure
- [x] Faza 4 — lint / typecheck / build

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Layout-shift przy doładowaniu sesji | Fallback na listę z planu; markery dokładają się in-place |
| Extra request przy każdej wizycie z sesją w toku | Tylko gdy `inProgressSession`; błąd cichy → lista z planu |
| Check-in mniej widoczny | Nadal pod foldem; value dla trenera, nie blocker startu treningu |

## Changelog

- 2026-08-12 — utworzono spec.
- 2026-08-12 — wdrożono: lista ćwiczeń zawsze (także w toku + markery), meta-linia, check-in disclosure.
- 2026-08-12 — odchudzenie: lista tylko `divide-y` (bez `border-y`), fold bez `border-t`, jeden jednoliniowy rytm wiersza.
