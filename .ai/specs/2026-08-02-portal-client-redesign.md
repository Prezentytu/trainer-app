# Portal klienta — redesign aplikacji treningowej

## TLDR

Wdrażamy design „Aplikacja klienta — trening (redesign)" w portalu klienta: tabela serii 6-kolumnowa z poprzednią sesją i celem z planu, sticky header z paskiem postępu, podsumowanie z wiadomością do trenera oraz dolna nawigacja Dziś / Historia / Progres / Profil. Timer przerwy zostaje pełnoekranowy + mini.

## Problem

Portal klienta ma 4 zakładki stanu lokalnego (Dziś/Tydzień/Historia/Rekordy) bez dolnej nawigacji, bez ekranów Progres i Profil. Logger sesji używa 3-kolumnowej tabeli (`Seria | Dziś | OK`) z ghost-placeholderami poprzedniej sesji w inputach — nagłówki się rozjeżdżają, nazwy ćwiczeń łamią się przez ghost-buttony „Poprz."/„Podmień", cele z planu nie są widoczne podczas logowania.

## Proponowane rozwiązanie

1. **Tabela serii** wg designu: `# | Poprz. | kg | powt. | ✓ | ×` — poprzedni wynik we własnej kolumnie, cele z planu w DTO (additive, bez migracji).
2. **Nagłówki** — pille RIR/przerwa, notatka trenera, menu `⋯` zamiast ghost-buttonów; sticky header z paskiem postępu.
3. **Podsumowanie** — grid 2×2, rekap, scalony check-in, wiadomość do trenera.
4. **IA portalu** — dolna nawigacja + trasy Dziś / Historia / Progres / Profil.
5. **Timer** — pełny ekran + mini (bez zmian zachowania); mini dostaje pasek postępu i `−15`/`+15`/`Pomiń`.

## Model danych

Bez zmian schematu. Cele z planu dołączane do DTO sesji w runtime z `PlanDay` / `PlanItem` / `PlanSet` (wzorzec `LoadRestSecondsAsync`).

Nowe pola w odpowiedzi `SessionDetail` (nie w encji):

- `LoggedExercise`: `targetRir`, `tempo`, `planNote`
- `LoggedSet`: `targetWeightKg`, `targetReps`, `targetDurationSeconds`

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/portal/{token}/sessions/{id}` | Additive: cele w `exercises[].sets[]` |
| GET | `/api/sessions/{id}` | j.w. (wspólny `Sessions.LoadDto`) |

Brak nowych endpointów. Progres i Profil liczone po stronie klienta z istniejących `sessions` + `records` + `home`.

Typy TS w `apps/web/lib/api.ts` lustrzane.

## UI

| Trasa | Ekran |
|---|---|
| `/portal/[token]` | Dziś (pasek tygodnia + karta treningu + sticky CTA) |
| `/portal/[token]/history` | Historia |
| `/portal/[token]/progress` | Progres (statystyki, słupki, rekordy) |
| `/portal/[token]/profile` | Profil (plan, auto-timer, ankieta, pomiary) |
| `/portal/[token]/session/[id]` | Trening na żywo / podsumowanie |

Dolna nawigacja w `portal/[token]/layout.tsx` — ukryta na trasie sesji.

Token: `--surface-raised` (`--ink-900`) → `bg-surface-raised` dla inputów i pływających kart.

## Fazy implementacji

- [x] Faza 1 — tokeny + spec + mapowanie typografii
- [x] Faza 2 — tabela serii 6-kolumnowa
- [x] Faza 3 — nagłówki sesji/ćwiczenia + zegar >1h
- [x] Faza 4 — cele z planu w DTO + test
- [x] Faza 5 — podsumowanie + check-in scalony
- [x] Faza 6 — dolna nawigacja + Dziś
- [x] Faza 7 — Progres + Profil
- [x] Walidacja `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Cele z planu rozjeżdżają się z seriami po edycji (dodaj/usuń) | Match po `setNumber`; brak celu → brak znacznika „poniżej" |
| Wąski ekran (<360px) — 6 kolumn | Kolumna `×` ukryta poniżej 360px; usuwanie w toolbarze |
| Zmiana kontraktu API | Tylko pola additive; stare klienty ignorują nowe pola |
| Auto-timer w Profilu | localStorage; domyślnie włączony (jak dziś) |

## Changelog

- 2026-08-02 — utworzono spec; decyzje: timer full+mini, check-in w podsumowaniu, cele bez migracji.
- 2026-08-02 — wdrożono: `--surface-raised`, cele w DTO, tabela 6-kolumnowa, IA portalu (Dziś/Historia/Progres/Profil), podsumowanie z wiadomością.
