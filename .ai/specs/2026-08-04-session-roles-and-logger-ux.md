# Sesja treningowa — role trener/klient + UX loggera

## TLDR

Naprawiamy zegar sesji (UTC bez `Z` → +2 h), rozdzielamy rolę trenera (podgląd read-only + jawna ścieżka „wpisz za klienta”) i przebudowujemy logger klienta na wzorce Gravitusa: pasek narzędzi nad klawiaturą, stabilny grid serii, nagłówek bez łamania nazwy.

## Problem

1. **Zegar od 2:00** — SQLite zwraca `DateTime` z `Kind=Unspecified`, JSON bez `Z`, przeglądarka traktuje UTC jako czas lokalny (CEST).
2. **Trener wykonuje trening** — „Dodaj trening” otwiera pełny `SessionLogger`; brak podglądu, ryzyko nadpisania serii klienta.
3. **UX loggera** — pasek narzędzi w przepływie dokumentu rozpycha wiersze; „Talerze” przy fokusie na powtórzeniach; nazwa ćwiczenia łamana przez pigułki; fullscreen rest po każdej serii.

## Proponowane rozwiązanie

- Konwerter UTC w `AppDb.ConfigureConventions` + `durationSeconds` z zegara klienta przy `finish`.
- Trener: `/sessions/[id]` = `SessionReview` (read-only); `/sessions/[id]/edit` = logger w trybie `behalf`.
- Klient: `SessionDock` (fixed nad klawiaturą) zamiast wstawki w wierszu; grid Gravitus; rest mini domyślnie.
- API: odrzucenie `performedOn` z przyszłości. Bez zmian schematu (poza konwersją Kind).

## Model danych

Bez nowych kolumn. Opcjonalne rozszerzenie DTO odpowiedzi (nie schematu):

- `LoggedExercise.prevPerformedOn: DateOnly?` — data poprzedniej sesji do nagłówka kolumny „Poprz.”.

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| * | wszystkie z `DateTime` | serializacja z sufiksem `Z` (UTC) |
| PUT | `/api/sessions/{id}` | 400 gdy `performedOn` > dziś UTC |
| PUT | `/api/portal/{token}/sessions/{id}` | j.w. |
| PATCH | `…/complete` | respektuje `durationSeconds` z ostatniego PUT |

Frontend: `SessionLogger` prop `mode?: "client" \| "behalf" \| "completedEdit"`; nowa strona `/edit`.

## UI

- `SessionReview` — podgląd trenera (plan vs wykonanie, check-in, komentarz).
- `SessionDock` + `useKeyboardInset` — pasek narzędzi kontekstowy + mini rest.
- `SessionLogger` — grid `# / Poprz. / kg / powt. / ✓ / ⋯`, dwurzędowy nagłówek, zwijanie ukończonych.

## Fazy implementacji

- [ ] Faza 1 — UTC + durationSeconds + test + walidacja przyszłości
- [ ] Faza 2 — SessionReview + trasy trenera + CTA profilu
- [ ] Faza 3 — SessionDock + przebudowa wierszy/nagłówka/rest

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Npgsql już zwraca Utc — podwójna konwersja | `SpecifyKind(Utc)` na już-Utc jest no-op |
| Trener w środku edycji starej sesji | banner + CTA „Zapisz wynik”; bez wake-lock |
| visualViewport niedostępny | fallback `bottom: 0` |

## Changelog

- 2026-08-04 — utworzono spec; decyzje: readonly+behalf, polish listy (nie guided Gravitus).
- 2026-08-04 — wdrożono: UTC converter, SessionReview + `/edit`, SessionDock, przebudowa loggera; bramka zielona.
