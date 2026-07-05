# {Tytuł funkcji}

## TLDR

{1–3 zdania: co budujemy i po co.}

## Open Questions (bramka — usuń po rozwiązaniu)

> Wypełnij tylko jeśli istnieją krytyczne niewiadome blokujące architekturę/model danych/zakres.
> Po zadaniu pytań **zatrzymaj się i poczekaj na odpowiedzi** — nie rozpisuj reszty specu.

- Q1: …
- Q2: …

## Problem

{Jaki problem rozwiązujemy? Kontekst, obecny stan, ograniczenia.}

## Proponowane rozwiązanie

{Wysokopoziomowe podejście. Dlaczego takie, a nie inne.}

## Model danych

{Nowe/zmienione encje (`apps/api/Models.cs`), relacje (`AppDb.cs`), input DTO (`Dtos.cs`).}
{Uwaga: zmiana schematu istniejącej encji wymaga usunięcia `trainer.db` — patrz `apps/api/AGENTS.md`.}

## Kontrakt API

{Endpointy `/api/...` (metoda, ścieżka, request, response). Odpowiadające typy i metody w `apps/web/lib/api.ts`.}

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/…` | — | `…` |

## UI

{Strony w `apps/web/app/...`, użyte prymitywy z `components/ui.tsx`, wpis w `NAV`.}

## Fazy implementacji

Każda faza kończy się działającą aplikacją i przechodzi bramkę walidacyjną.

- [ ] Faza 1 — backend: encja + DTO + endpointy + seed + test
- [ ] Faza 2 — frontend: klient API + strony + nawigacja
- [ ] Faza 3 — dopięcie / edge case'y

## Ryzyka i wpływ

{Konkretne scenariusze porażki: co, jak groźne, jak mitygujemy, jakie ryzyko rezydualne.}

## Changelog

- {YYYY-MM-DD} — utworzono spec.
