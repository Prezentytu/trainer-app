# Redesign zakładki Klienci

## TLDR

Minimalistyczna lista klientów (pełnoszerokościowe wiersze + sygnał ostatniego treningu + modal dodawania) i odchudzony profil klienta (3 zakładki, bez duplikacji akcji i szumu), wzorowane na TrueCoach / Everfit / FitPros.

## Problem

Lista klientów to ciasne kafelki z drobnym tekstem i zawijającymi się badge'ami; „+ Dodaj klienta” toggluje formularz inline. Profil klienta jest przeładowany: 5 zakładek, zdublowane „Loguj trening”, heatmapa i średnie check-inów na górze, surowe daty ISO, ściana przycisków przy każdym przypisaniu.

## Proponowane rozwiązanie

1. **Lista** — jedna kolumna wierszy (enumeracja, nie dashboard KPI); prawa strona = „ostatni trening” + status planu; dodawanie w `Dialog`.
2. **Profil** — hero aktywnego planu + 3 KPI w jednej karcie; zakładki `Plany` / `Historia` / `Wyniki`; heatmapa tylko w Historii; akcje przypisań zredukowane (bez zdublowanego logowania i „Anuluj”); formularze maxów/pomiarów za progressive disclosure.
3. **API** — addytywnie `lastSessionOn` w `GET /api/clients` (bez migracji schematu).

Decyzje UX:
- Status `cancelled` osiągalny przez „Usuń” (z undo) lub zakończenie — bez osobnego „Anuluj” na wierszu.
- Domyślna zakładka: Historia gdy są sesje, inaczej Plany.
- Kopiowanie linku portalu → toast, nie baner z URL.

## Model danych

Bez zmian schematu / migracji. Agregacja z istniejących `WorkoutSession` (`Status == "completed"`, `PerformedOn`).

## Kontrakt API

| Metoda | Ścieżka | Request | Response (zmiany) |
|---|---|---|---|
| GET | `/api/clients` | — | + `lastSessionOn: string \| null` (ISO `YYYY-MM-DD`) |

Typ `ClientSummary` w `apps/web/lib/api.ts` lustrzany.

## UI

- `apps/web/app/(app)/clients/page.tsx` — lista + modal.
- `apps/web/app/(app)/clients/[id]/page.tsx` — profil.
- `apps/web/lib/dates.ts` — wspólne `daysAgo` / `relativeDayLabel` / `formatDayShort` / `withinLastDays`.
- `apps/web/components/skeletons.tsx` — `ClientListSkeleton`, `ClientDetailSkeleton`.
- Prymitywy: `PageHeader`, `Card`, `Button`, `Dialog`, `Avatar`, `Badge`, `StatBlock`, `Tabs`, `Pill`, `EmptyState`, `useUndoToast`.

## Fazy implementacji

- [x] Faza 1 — backend: `lastSessionOn` + test + typ TS
- [x] Faza 2 — lista klientów + modal + skeleton
- [x] Faza 3 — szczegóły klienta (hero/KPI/zakładki) + skeleton + walidacja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| `lastSessionOn` w SELECT dla wielu klientów | Prosty `Max` po sesjach completed; indeks `ClientId_Status` już istnieje |
| Usunięcie zakładki „Anuluj” / osobnych maxów | Status cancelled nadal w API; maxy/pomiary w sekcji Wyniki |
| Dialog bez `loading` na confirm | Guard `saving` w handlerze |

## Changelog

- 2026-08-01 — utworzono spec; decyzje: lista zamiast kafelków, modal dodawania, 3 zakładki, agresywne odchudzenie profilu.
- 2026-08-01 — wdrożono: `lastSessionOn`, lista wierszy + modal, profil z 3 zakładkami i progressive disclosure.
- 2026-08-01 — CTA „Dodaj trening”; heatmapa „Zgodność” → `WeeklyActivityBar`; ProgressRing + ikony Lucide w profilu.
