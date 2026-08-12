# Audyt UX panelu trenera — nawigacja, skrzynka, minimalizm

## TLDR

Wdrożenie wniosków z audytu UX (perspektywa trenera + test odejmowania): kolejność NAV, czytelny Panel (ludzki język, sensowne KPI, sekcja „Od klientów”), mniej zakładek na karcie klienta z widocznymi check-inami i lazy-loadem. Podgląd tygodnia w portalu — poza zakresem (osobny spec).

## Decyzje (rozstrzygnięte)

| # | Pytanie | Decyzja |
|---|---|---|
| Q1 | Zakres „Od klientów” | (1) nieprzeczytane `ClientReply`, (2) `session.Note` z 7 dni bez odpowiedzi trenera (`TrainerComment == null`), (3) check-iny 7 dni z `MoodScore ≤ 2`. Cap 8. Bez migracji. |
| Q2 | Podgląd tygodnia w portalu | **Poza tym cyklem** — osobny spec gdy będzie priorytet. |

## Problem

1. Klient wysyła wiadomość po treningu i robi check-iny — trener nie widzi ich na Panelu (głuchy kanał vs pitch „consolidation”).
2. NAV: Ćwiczenia przed Planami; liczniki encji wyglądają jak „nieprzeczytane”.
3. „zgodność X%” / „Compliance” — żargon, lekcja „Prosty język”.
4. Trzy KPI → ten sam `/clients` (fałszywa affordance).
5. 6 zakładek na karcie klienta; check-iny niewidoczne; 9 eager requestów.

## Proponowane rozwiązanie

### Faza 1 (bez zmian API / addytywne copy)

- NAV: `Panel · Klienci · Plany · Ćwiczenia · Ustawienia`; bez badge liczników (zostaje `navCounts` pod przyszłą skrzynkę).
- Panel: „zgodność” → „N z M treningów” (pola `completedInWindow` / `expectedInWindow` w attention — addytywne); ChurnRadar: „Compliance” → PL.
- KPI: kotwice na stronie (`#klienci-tygodnia`, `#ostatnie-sesje`, `#nowe-rekordy`) zamiast trzech identycznych linków.
- Karta klienta: jedna zakładka „Notatki” + `SegmentedControl` (Moje / Klienta).
- Mobile: checklist `responsive-ui` na Panel / klient / plany — poprawki tylko przy realnych bugach.

### Faza 2 (kontrakt addytywny)

- `GET /api/dashboard` → `fromClients: DashboardFromClientItem[]`.
- UI: karta „Od klientów” nad „Wymagają uwagi”; klik → sesja / klient; wejście w sesję z nieprzeczytaną odpowiedzią nadal oznacza przez istniejące `markReplyRead`.
- Check-iny na karcie klienta w zakładce Historia (lista pod sesjami, lazy).
- Lazy-load: eager = profil + sesje + progress + rekordy (hero); reszta per zakładka.

## Model danych

Bez nowych encji / migracji. Wykorzystanie: `WorkoutSession.ClientReply*`, `ClientCheckIn`.

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/dashboard` | + `fromClients[]`; w `attention[]` + `completedInWindow`, `expectedInWindow` (opcjonalne) |
| GET | `/api/clients/{id}/check-ins` | bez zmian (już jest) |

`DashboardFromClientItem`:

```ts
{
  kind: "session_reply" | "session_note" | "low_checkin";
  clientId: number;
  clientName: string;
  sessionId?: number | null;
  checkInId?: number | null;
  preview: string;       // skrót wiadomości / „Samopoczucie 2/5”
  at: string;            // ISO date lub DateTime
}
```

Lustrzane typy w `apps/web/lib/api.ts`.

## UI

- [`TrainerDashboard.tsx`](apps/web/components/TrainerDashboard.tsx) — Od klientów, copy, kotwice KPI.
- [`AppShell.tsx`](apps/web/components/AppShell.tsx) — NAV.
- [`clients/[id]/page.tsx`](apps/web/app/(app)/clients/[id]/page.tsx) — Notatki, check-iny, lazy.
- [`ChurnRadar.cs`](apps/api/ChurnRadar.cs) + [`Program.cs`](apps/api/Program.cs) dashboard.

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — NAV, copy, KPI, notatki, mobile
- [x] Faza 2 — fromClients + check-iny + lazy-load
- [x] Walidacja `./scripts/check.sh`

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Hałas na Panelu przy wielu check-inach | Cap 8; tylko mood ≤ 2; sekcja ukryta gdy pusto |
| Duplikacja z „Wymagają uwagi” (low_wellness) | fromClients = świeże sygnały treści; attention = churn/radar |
| Regresja wydajności dashboardu | Dwa lekkie query (unread replies, low check-ins 7d) |

## Changelog

- 2026-08-12 — utworzono spec; decyzje Q1/Q2 rozstrzygnięte w planie audytu.
- 2026-08-12 — wdrożono: NAV (kolejność + bez liczników), Panel (Od klientów, copy „N z M”, kotwice KPI), karta klienta (Notatki 5 tabów, check-iny w Historii, lazy-load), rozszerzenie `/api/dashboard.fromClients` + pola attention, test `Dashboard_IncludesFromClients`.
