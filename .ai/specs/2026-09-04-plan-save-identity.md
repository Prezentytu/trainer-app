# Niezawodny zapis planu i tożsamość tygodni

## TLDR

Zapis planu nie scala dni, nie freezuje przycisku i nie gubi numeracji tygodni. Tożsamość encji idzie po `key` klienta ze snapshotu PUT, nie po `(weekNumber, order)` bieżącego draftu. Tygodnie są zawsze `1…N`. Ćwiczenie, dzień i tydzień przenosi się przeciąganiem; kopia zawsze tworzy nowe encje. Draft w `localStorage` przeżywa odświeżenie.

## Problem

Wielokrotne „Duplikuj do tygodnia” + autosave przyklejały to samo `PlanDay.Id` do kilku dni (`applySavedIds` matchował bieżący draft po tygodniu i kolejności). `MergePlanDays` nadpisywał jedną encję wielokrotnie: tygodnie znikały, pozycje bez Id doklejały się do jednego dnia (6 ćwiczeń → 18). `handleSubmit` ustawiał `saving=true` i na sukcesie robił `router.push` na ten sam URL — przycisk zostawał na „Zapisywanie…”. `normalizeWeeks` nie odpalało się po `removeDay` / `duplicateDay` / `copyWeek`, więc zakładki zostawały `2, 5, 9`.

## Proponowane rozwiązanie

- Snapshot wysłanych dni + mapa `key → id` z odpowiedzi PUT. Stary match na aktualnym stanie — usunięty.
- `compactDayOrders` + `normalizeWeeks` po każdej operacji strukturalnej. Nowy dzień: `max(order)+1`.
- PUT: `409` przy zdublowanym `id` albo `(weekNumber, order)` — bez cichego merge.
- Jedna kolejka zapisu, timeout, `finally`, edycja istniejącego planu zostaje w kreatorze.
- Jeden `DndContext`: pigułki T/D są źródłem i celem. Menu: przenieś (to samo `entityId`) vs kopiuj do wielu tygodni (bez `entityId`).
- `localStorage` + „Pobierz kopię roboczą” / „Wgraj kopię roboczą” — na następny raz, nie na incydent na produkcji bez refresh.

Bez zmiany schematu bazy. Bez nowej zależności.

## Model danych

Bez nowych encji. `PlanDay` / `PlanItem` / `PlanSet` bez zmian.

Builder: `key` (klient) + opcjonalne `entityId`. Kopiowanie czyści `entityId`. Przeniesienie zostawia.

## Kontrakt API

`PUT /api/plans/{id}` bez nowej ścieżki. Ten sam `PlanInput`.

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| PUT | `/api/plans/{id}` | `409 { message }` gdy payload ma zdublowane `days[].id`, zdublowane `(weekNumber, order)` albo zdublowane `items[].id` / `order` w dniu. Inaczej merge po Id jak dziś. |

Typy w `apps/web/lib/api.ts` bez zmiany kształtu. `plans.update` przyjmuje opcjonalny `signal`.

## UI

- [`PlanToolbar`](apps/web/components/plan-builder/PlanToolbar.tsx) — status zapisu, „Pobierz kopię roboczą”, „Wgraj kopię roboczą”.
- [`WeekTabs`](apps/web/components/plan-builder/WeekTabs.tsx) — przeciąganie pigułek T i D.
- [`DayMenu`](apps/web/components/plan-builder/DayMenu.tsx) — Przenieś / Kopiuj do… (wielokrotny wybór), bez listy N linków.
- Baner przywracania kopii z przeglądarki nad kreatorem.

Teksty po polsku, skill `ux-writing`. Tokeny mono v2.

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — tożsamość (helpery, draft, PUT 409, testy API)
- [x] Faza 3 — maszyna zapisu
- [x] Faza 4 — drag + kopiowanie do wielu tygodni
- [x] Faza 5 — localStorage + plik kopii roboczej
- [x] Faza 6 — bramka + weryfikacja w przeglądarce na nowym planie

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja |
|---|---|---|
| Stary PUT wraca po kolejnej duplikacji | Złe Id na nowych klonach | Mapa ze snapshotu + numer generacji; ignoruj stale |
| Luki `order` przy starym draftcie | Kolizja i 409 | `compactDayOrders` przed każdym PUT |
| Refresh na produkcji z draftem tylko w RAM | Utrata pracy (Janusz) | localStorage po deployu; ten incydent = screeny |
| Drag pigułki zamiast wyboru tygodnia | Przypadkowe przeniesienie | `activationConstraint.distance` 8 px; tap = wybór |

## Changelog

- 2026-09-04 — wdrożono fazy 1–6: tożsamość po `key` + snapshot, PUT 409, maszyna zapisu, drag pigułek T/D, kopiowanie do wielu tygodni, kopia robocza w `localStorage`.
