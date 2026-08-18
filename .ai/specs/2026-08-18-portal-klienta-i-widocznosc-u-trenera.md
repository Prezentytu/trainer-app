# Portal klienta i widoczność u trenera

## TLDR

Panel trenera pokazuje na liście i Panelu, że klient trenuje teraz albo że sesja wymaga korekty — bez wchodzenia w trening. Sidebar zostaje na miejscu. Zapytania EF idą jako split query. Portal dostaje niezawodność sesji, lżejszy logger, pętlę feedbacku i eksport historii.

## Problem

Lista klientów i dashboard liczą tylko sesje `completed`. Baner „trenuje teraz” i czerwony ▼ przy serii poniżej celu żyją wyłącznie w `SessionReview`. Sidebar ma `sticky`, ale `overflow-x: hidden` na `html`/`body` go zabija. Logi API sypią `MultipleCollectionIncludeWarning`. Portal ma już logger klasy Hevy — brakuje zapisu po każdym tapie, jawnego „pomiń”, form checku wideo i eksportu danych klienta.

## Proponowane rozwiązanie

Pięć fal. T bez zmiany schematu (projekcja + poll 15–20 s). N/L bez schematu. F dodaje upload wideo przy ćwiczeniu (nowa encja, migracja). Z bez schematu poza ewentualnym endpointem eksportu.

## Model danych

Fale T, N, L, Z: bez nowych encji.

Fala F — `LoggedExerciseFormCheck`:

- `Id`, `LoggedExerciseId`, `StorageKey` (ścieżka jak zdjęcia sylwetki), `CreatedAt`
- Relacja 0–1 lub 1–n do `LoggedExercise` (jeden klip na ćwiczenie w sesji wystarczy)

Bez zmian `WorkoutSession` / `LoggedSet`. Feeling 1–5 już jest.

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/clients` | `liveSession?`, `needsReview?` |
| GET | `/api/dashboard` | `liveSessions[]`, `needsReview` na recent |
| GET | `/api/clients/{id}` | te same pola w nagłówku |
| GET | `/api/clients/{id}/sessions` | `belowTargetCount` opcjonalnie |
| PUT | `/api/portal/{token}/sessions/{id}` | bez zmian kontraktu (zapis częściej) |
| POST | `/api/portal/{token}/sessions/{id}/exercises/{exId}/form-check` | upload wideo/zdjęcia (F) |
| GET | `/api/portal/{token}/sessions/{id}/exercises/{exId}/form-check` | blob form check |
| GET | `/api/sessions/{id}/exercises/{exId}/form-check` | blob form check (trener) |
| GET | `/api/portal/{token}/export` | CSV sesji+serii (Z) |
| GET | `/api/portal/{token}/maxes` | maxy read-only |
| GET | `/api/portal/{token}/history-import/pending` | status draftu importu |

Typy lustrzane w `apps/web/lib/api.ts`.

`liveSession`: `{ sessionId, startedAt, doneSets, totalSets }`.
`needsReview`: `{ sessionId, belowTargetCount }` — ukończona sesja z seriami poniżej celu, bez `trainerComment`.

## UI

- Lista klientów, Panel, karta klienta: „Trenuje teraz · 6/12 serii” (`--gain` + glif); „▼ N serie poniżej celu” (`--loss`).
- `AppShell`: viewport-lock na `md+`, scroluje `main`.
- Logger: wiersz Poprz / kg / powt / ✓; „Pomiń ćwiczenie”; draft synchroniczny.
- Summary: PR-y + „zapisane — trener zobaczy”.
- Profil portalu: eksport CSV.

## Fazy implementacji

- [x] Fala T — live status, sticky nav, `SplitQuery`
- [x] Fala N — draft po serii, kolejka widoczna, offline start, undo odrzucenia
- [x] Fala L — wiersz serii, pomiń, „przenieść na dziś?”, spokojny Dziś
- [x] Fala F — form check, trend feeling, Peak-End, wellness
- [x] Fala Z — eksport, maxy, status importu, pas copy
- [x] Bramka `./scripts/check.sh` po każdej fali

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja |
|---|---|---|
| Poll bije API przy 30 klientach | zbędny ruch | 15–20 s, tylko `visibilityState === visible` |
| SplitQuery zmienia kolejność Include | puste nawigacje | testy integracyjne sesji/planu |
| Viewport-lock psuje kreator | podwójny scroll | kreator już lockuje — nie ruszać `isPlanEditor` |
| Form check bez limitu | duże pliki | jak zdjęcia sylwetki: typ + max size |
| Debounce → sync draft | jank na każdym keystroke | zapis przy zatwierdzeniu serii, nie przy każdym znaku |

## Changelog

- 2026-08-18 — utworzono spec.
- 2026-08-18 — wdrożono fale T–Z: live status + sticky nav + SplitQuery; draft po serii, kolejka, offline start, undo odrzucenia; pomiń / rest day / wiersz serii; form check (encja `LoggedExerciseFormCheck`), trend feeling, Peak-End, wellness; eksport CSV, maxy, status importu.
