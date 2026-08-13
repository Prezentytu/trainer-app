# Pętla retencji trenera i monetyzacja

## TLDR

Domknięcie obietnicy „Wysyłasz link. Widzisz trening.”: e-mail do trenera po sesji / odpowiedzi / PR, tygodniowy digest, self-serve Stripe z limitem 5 osób, zdjęcia postępu w bazie (bez nowej zależności), PIN portalu, import CSV, skrzynka „Od klientów”, gotowce WhatsApp w panelu. Kalendarz, dieta i czat — poza zakresem.

## Problem

Rdzeń coachingowy działa, ale trener nie dostaje sygnału, gdy klient trenował; darmowy limit 5 osób nie jest egzekwowany; nie da się zapłacić subskrypcji. To blokuje „używam i płacę”.

## Proponowane rozwiązanie

- Powiadomienia e-mail (Resend, jak dziś) + opt-out w `/settings`.
- `Trainer.PlanKey` + Stripe Checkout `mode=subscription` (HTTP, bez NuGet) + webhook + Customer Portal.
- Limit klientów tylko gdy `PlanKey != "dev"` (konto lokalne bez limitu, testy bez zmian).
- Zdjęcia postępu: `byte[]` w SQLite/Postgres, kompresja po stronie klienta.
- PIN 4 cyfry (SHA256 + salt) + opcjonalne `ExpiresAt` na tokenie.
- Generator: powiel tydzień na N tygodni z kumulatywną progresją (CopyWeek).
- Copy landingu: dla kogo NIE jesteśmy; dieta = trzymaj PDF.

## Model danych

`Trainer`: `PlanKey` (free/starter/pro/studio/founding/dev), `StripeCustomerId`, `StripeSubscriptionId`, `NotifySessionComplete/ClientReply/Pr/WeeklyDigest` (domyślnie true), `LastDigestSentOn`.

`Client`: `PortalPinHash`, `PortalPinSalt`.

`ClientProgressPhoto`: `TakenOn`, `View`, `Note`, `ContentType`, `Bytes`.

Limity: free 5, starter 15 (39 zł), pro 30 (99 zł), studio 50 (199 zł), founding 15, dev bez limitu.

## Kontrakt API

| Metoda | Ścieżka | Uwagi |
|---|---|---|
| GET/PUT | `/api/me`, `/api/me/preferences` | plan, limity, opt-out |
| POST | `/api/billing/checkout` | `{ planKey }` → `{ checkoutUrl }` |
| POST | `/api/billing/portal` | Stripe Customer Portal |
| POST | `/api/stripe/webhook` | publiczny |
| POST | `/api/clients/import` | CSV imię,e-mail |
| GET/POST/DELETE | `/api/clients/{id}/photos` | metadata + blob |
| POST | `/api/clients/{id}/portal-pin` | `{ pin }` lub `{ pin: null }` |
| POST | `/api/clients/{id}/access-token/expire` | `{ days }` |
| GET | `/api/inbox` | skrzynka |
| POST | `/api/cron/digest` | tygodniowy e-mail |
| GET/POST | `/api/portal/{token}/pin-status`, `…/unlock` | PIN |
| GET/POST/DELETE | `/api/portal/{token}/photos` | zdjęcia klienta |

## UI

Ustawienia: powiadomienia + plan. Klienci: import CSV, limit z CTA. Profil klienta: PIN, ważność linku, WhatsApp, zdjęcia. Portal: bramka PIN + upload zdjęć. `/inbox` w NAV. CopyWeek: liczba kopii.

## Fazy implementacji

- [x] Faza 1 — backend (encje, billing, notify, digest, PIN, photos, import, inbox)
- [x] Faza 2 — frontend
- [x] Faza 3 — testy + migracja EF

## Ryzyka i wpływ

- Stripe nie skonfigurowany → checkout 409, limit free i tak działa na produkcji (Clerk).
- Blob w DB → kompresja JPEG max ~500 KB, limit 8 zdjęć na klienta.
- Token w URL zostaje; PIN to dodatkowa warstwa, nie zamiana magic-linka.
- `EnsureCreated` nie migruje SQLite — po zmianie usuń `trainer.db`.

## Changelog

- 2026-08-13 — utworzono spec i wdrożono.
