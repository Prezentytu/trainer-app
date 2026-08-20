# Kopia osoby między środowiskami

## TLDR

Trener pobiera z karty klienta przenośną kopię (plany, historia, pomiary, wywiad, notatki, zdjęcia sylwetki) i wgrywa ją na innym koncie — np. z `dev.repmaxer.pl` na produkcję. API nadaje nowe Id, ćwiczenia dopasowuje po nazwie. Link do portalu, PIN i nagrania techniki nie przechodzą.

## Problem

Eksport `GET /api/export` to archiwum całego konta (RODO), nie da się go wgrać. `POST /api/clients/import` tworzy puste karty z listy. Żeby przenieść prawdziwego podopiecznego z dewa na prod, trzeba ręcznie przepisywać plany i historię.

## Proponowane rozwiązanie

Wersjonowany dokument `repmaxer.client-bundle` v1:

- `GET /api/clients/{id}/bundle` — kopia jednej osoby, scoped do trenera.
- `POST /api/clients/bundle` — zawsze **nowa** karta u zalogowanego trenera (nigdy nadpisanie). Limit planu jak przy „Dodaj klienta”.

Ćwiczenia: najpierw wspólna biblioteka / własne po znormalizowanej nazwie, inaczej kopia własna. Plany z przypisań i sesji — zawsze nowe (nie szukamy szablonu po nazwie).

Świadomie pominięte: tokeny portalu, hash PIN, push, powiadomienia w skrzynce, szkice importu historii, bajty form check (zostaje licznik w `meta` i ostrzeżenie).

## Model danych

Bez zmiany schematu. Format żyje w `ClientBundle.cs` (rekordy dokumentu), nie w encjach EF.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/clients/{id}/bundle` | — | `ClientBundleDocument` |
| POST | `/api/clients/bundle` | `ClientBundleDocument` | `{ clientId, name, createdPlans, createdExercises, sessionCount, warnings[] }` |

Istniejące `/api/export` i `/api/clients/import` (lista) bez zmian.

Typy i metody w `apps/web/lib/api.ts`: `api.clients.exportBundle`, `api.clients.importBundle`.

## UI

- Karta klienta: ghost na dole, obok „Usuń klienta” — „Pobierz plany i historię”. Nie w hero.
- Ustawienia: „Wgraj plany i historię”. Po sukcesie przejście na nową kartę.
- Bez słowa „JSON” w etykietach — format tylko w nazwie pliku (`repmaxer-jan-kowalski-2026-08-18.json`).

## Fazy implementacji

- [x] Faza 1 — backend: `ClientBundle` + endpointy + test round-trip
- [x] Faza 2 — frontend: klient API + pobieranie/wgrywanie

## Ryzyka i wpływ

| Scenariusz | Groźba | Mitygacja | Residual |
|---|---|---|---|
| Id ćwiczeń/planów inne na prodzie | Urwane FK, pusta historia | Snapshot ćwiczeń + mapa Id w jednej transakcji | Ćwiczenie o tej samej nazwie i innym znaczeniu trafi w bibliotekę |
| Limit osób na darmowym planie | 409 w połowie wgrywania | `RejectIfAtLimit` przed zapisem | Trener musi zmienić plan |
| Nagrania techniki / duże body | Timeout, 413 | Form check poza kopią; zdjęcia max 500 KB jak w UI | Form check do ponownego wrzucenia |
| Stary link portalu z dewa | Klient wchodzi na złe środowisko | Tokenów nie kopiujemy; copy każe wysłać nowy link | — |
| Wgranie archiwum `/api/export` | Śmieci w bazie | `kind` musi być `repmaxer.client-bundle` | 400 |

## Changelog

- 2026-08-18 — utworzono spec i wdrożono v1.
