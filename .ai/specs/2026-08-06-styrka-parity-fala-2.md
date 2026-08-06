# Parytet ze Styrką — Fala 2 (progres w portalu)

## TLDR

Domknięcie insightów progresu w portalu klienta bez migracji: Największy progres (90 dni), wykres e1RM per ćwiczenie, kalendarz miesiąca, średni czas treningu, sparkline wagi na pomiarach.

Benchmark: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`. Fale 0–1: `.ai/specs/2026-08-06-styrka-parity-fale-0-1.md`.

## Problem

Trener ma TrendSparkline i WeightTrendSparkline; klient na `/progress` widzi tylko listę rekordów i tonaż. Styrka pokazuje Most Improved, kalendarz i wykresy — to retencja po treningu.

## Proponowane rozwiązanie

- `GET .../most-improved?days=90` — top ćwiczenie po % przyroście e1RM (min. 2 sesje w oknie).
- `GET /api/portal/{token}/exercises/{id}/stats` — mirror istniejącego endpointu trenera (trend e1RM).
- UI `/progress`: karta Największy progres, expand rekordu → TrendSparkline, kalendarz miesiąca, StatBlock śr. czas (liczony z sesji 30 dni po stronie klienta).
- UI `/measurements`: WeightTrendSparkline.

## Model danych

Bez zmian schematu.

## Kontrakt API

| Metoda | Ścieżka | Response |
|---|---|---|
| GET | `/api/portal/{token}/most-improved?days=90` | `{ exerciseId, exerciseName, percentGain, startE1Rm, endE1Rm, deltaKg, days } \| null` |
| GET | `/api/clients/{id}/most-improved?days=90` | j.w. |
| GET | `/api/portal/{token}/exercises/{exerciseId}/stats` | jak `ExerciseStats` trenera |

## UI

- [`portal/.../progress/page.tsx`](apps/web/app/portal/[token]/progress/page.tsx) — karta, kalendarz, śr. czas, expand rekordów
- [`portal/.../measurements/page.tsx`](apps/web/app/portal/[token]/measurements/page.tsx) — sparkline wagi

## Fazy

- [x] Faza 0 — ten spec
- [x] Faza 1 — MostImproved + endpointy + portal exercise stats
- [x] Faza 2 — UI progress + measurements
- [x] Faza 3 — check.sh, changelog, update inwentaryzacji Styrki

## Changelog

- 2026-08-06 — utworzono spec.
- 2026-08-06 — zaimplementowano: `MostImprovedAsync`, endpointy portal/trener, `portal.exerciseStats`, karta Największy progres, expand e1RM, kalendarz miesiąca, śr. czas, sparkline wagi na pomiarach.
