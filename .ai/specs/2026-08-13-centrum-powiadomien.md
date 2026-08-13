# Centrum powiadomień trenera

## TLDR

Trwały dziennik `TrainerNotification` zamiast wyliczanej skrzynki: badge z licznikiem w nawigacji, stan przeczytane/nieprzeczytane dla notatek, odpowiedzi, check-inów, zdjęć, pomiarów i wywiadu. E-maile do trenera ograniczone do codziennego podsumowania nieprzeczytanych (max 1/dzień), natychmiastowych odpowiedzi klienta i poniedziałkowego digestu — bez maila po każdej sesji i PR.

## Problem

Gdy klient dopisze notatkę do treningu, trener nie ma sygnału — musi wejść w konkretną sesję. Skrzynka `/inbox` istnieje, ale pozycje są wyliczane w locie z oknem 14 dni, stan „przeczytane” ma tylko odpowiedź klienta, NAV nie pokazuje licznika, a zdjęcia/pomiary/wywiad w ogóle nie trafiają do skrzynki. Dodatkowo każdy ukończony trening (i każdy PR) wysyła osobny e-mail — przy 15 klientach to dziesiątki maili tygodniowo.

## Proponowane rozwiązanie

- Encja `TrainerNotification` tworzona w endpointach portalu.
- `/inbox` czyta z dziennika: filtry, mark read / read-all, auto-odczyt po otwarciu sesji.
- Licznik nieprzeczytanych w NAV (sidebar + kropka na mobile).
- E-mail: usunąć per sesja i per PR; dodać dzienne podsumowanie nieprzeczytanych; zostawić reply i tygodniowy digest.

## Model danych

`TrainerNotification`: `Id`, `TrainerId`, `ClientId`, `Kind` (`session_note | session_reply | low_checkin | out_of_order | history_import | photo | measurement | intake`), `SessionId?`, `CheckInId?`, `Preview`, `CreatedAt`, `ReadAt?`.

`Trainer`: `NotifySessionComplete` + `NotifyPr` → `NotifyDailySummary` (domyślnie true); `NotifyClientReply`, `NotifyWeeklyDigest` bez zmian; `LastActivityEmailOn` (DateOnly?, guard 1 mail/dzień).

## Kontrakt API

| Metoda | Ścieżka | Uwagi |
|---|---|---|
| GET | `/api/inbox?unreadOnly=&kind=&take=` | lista z `id`, `readAt`; bez okna czasowego dla nieprzeczytanych |
| POST | `/api/inbox/{id}/read` | oznacza jedną |
| POST | `/api/inbox/read-all` | oznacza wszystkie trenera |
| GET | `/api/dashboard` | `fromClients` z dziennika; licznik unread w counts |
| POST | `/api/sessions/{id}/comment/read` | oznacza też notyfikacje `session_note`/`session_reply` sesji |
| GET/PUT | `/api/me`, `/api/me/preferences` | `notifyDailySummary` zamiast session/PR |
| POST | `/api/cron/digest` | część dzienna (podsumowanie unread) + poniedziałkowy digest |

## UI

`/inbox`: segmented Wszystkie/Nieprzeczytane, chipy kategorii, grupowanie po dniu, „Oznacz wszystkie jako przeczytane”. NAV: licznik przy „Od klientów”, kropka na mobile. `/settings`: trzy przełączniki e-mail.

## Fazy implementacji

- [x] Faza 1 — backend (encja, emit, endpointy, e-mail, migracja)
- [x] Faza 2 — frontend (api.ts, NAV, inbox, settings, dashboard)
- [x] Faza 3 — testy + bramka

## Ryzyka i wpływ

- Zmiana schematu = migracja EF + reset lokalnego `trainer.db`.
- Kontrakt inbox i `/api/me` się zmienia — aktualizujemy front w tym samym zadaniu.
- Dzienne podsumowanie zależy od codziennego crona; jeśli scheduler działa rzadziej, mail przychodzi rzadziej — nic nie ginie w skrzynce.

## Changelog

- 2026-08-13 — utworzono spec i wdrożono.
