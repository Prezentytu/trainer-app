# Eksport i import jednego planu

## TLDR

Trener pobiera plik jednego planu (serie, rampy, superserie, ciężary) i wgrywa go na drugim koncie albo środowisku. Kopia osoby zostaje do przenoszenia historii; tu nie trzeba karty klienta. Wgranie nigdy nie nadpisuje istniejącego planu.

## Problem

`Pobierz plany i historię` to kopia **osoby**: tylko plany z przypisania albo sesji. Plan „kolejny cykl”, którego jeszcze nie przypisano, nie wchodzi do pliku. Na liście Planów jest „Importuj” z tekstu (AI), nie z pliku. Po wgraniu kopii osoby karty wyglądają pusto (`3 × 1 s`), bo importowane pozycje siłowe mają śmieciowe `durationSeconds: 1` / `distanceMeters: 1`, a podsumowanie woli czas nad powtórzeniami.

## Proponowane rozwiązanie

Dokument `repmaxer.plan-bundle` v1: ćwiczenia użyte w planie + jeden plan (dni, pozycje, `prescribedSets`). Te same mapowania co kopia osoby.

- `GET /api/plans/{id}/bundle` — kopia tego planu.
- `POST /api/plans/bundle` — zawsze **nowy** plan. Przyjmuje też `repmaxer.client-bundle` i wyciąga z niego same plany (bez nowej karty), żeby dało się wgrać już pobrany plik osoby.

Przy budowie encji: gdy miara to powtórzenia, zerujemy czas i dystans na pozycji i seriach (śmieci z importu AI). Podsumowanie karty czyta powtórzenia przed czasem.

## Model danych

Bez zmiany schematu. Format w `ClientBundle.cs` (`PlanBundleDocument`).

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/plans/{id}/bundle` | — | `PlanBundleDocument` |
| POST | `/api/plans/bundle` | plan-bundle albo client-bundle | `{ planIds, names, createdExercises, warnings[] }` |

`apps/web/lib/api.ts`: `api.plans.exportBundle`, `api.plans.importBundle`.

## UI

- Podgląd i kreator: w menu planu „Pobierz plan”.
- Lista Planów: „Wgraj plan” (plik). „Importuj” zostaje importem z tekstu.
- Ustawienia: plik planu → komunikat, że wgrywa się w Planach.

Copy: Pobierz plan / Wgraj plan — zawartość, nie format.

## Fazy implementacji

- [x] Faza 1 — API + sanityzacja + testy
- [x] Faza 2 — UI pobierz/wgraj + podsumowanie karty
- [x] Faza 3 — bramka walidacyjna

## Ryzyka i wpływ

- **Niezapisany kreator.** Pobieramy ostatnią zapisaną wersję z API, nie draft. Autosave zwykle zdąży; przy „Niezapisane” i tak schodzi to, co leży w bazie.
- **Ten sam plik osoby.** Wgranie w Planach nie tworzy drugiej karty — tylko plany. Historia nadal tylko przez Ustawienia.
- **Śmieci 1 s.** Sanityzacja przy wgraniu czyści nowe kopie; stare już w bazie naprawia podsumowanie (powtórzenia przed czasem).

## Changelog

- 2026-08-20 — spec + wdrożenie.
