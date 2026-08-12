# Biurko trenera — inbox w 5 sekund

## TLDR

Onboarding to jedna guided ścieżka (CTA = następny krok, preset 4×3 nie 6×4, kopiuj link z przyciskiem). Panel po onboardingu: KPI + jedna ranked kolejka „Do zrobienia” (1 CTA na wiersz). Karta klienta: odejmowanie hero; Wyniki zaczynają od 3 faktów.

## Problem

1. Checklista mówi klient → plan → link, header zawsze `+ Nowy plan` na preset 6×4 (24 puste dni). Krok 3 bez przycisku. Happy path `?clientId=` jest ukryty.
2. Radar i „Od klientów” są mocne, ale układ je rozwadnia: dwie listy, do 4 CTA na wiersz, KPI schowane za onboardingiem.
3. Karta klienta: StatBlocki duplikują Panel; Wyniki = mini-BI bez narracji 3 faktów.

## Proponowane rozwiązanie

### Onboarding

- Header CTA przy `showOnboarding` = następny krok: „Dodaj klienta” / „Przypisz plan” (`/plans/new?clientId=` pierwszego klienta) / „Skopiuj link”.
- Po onboardingu: `+ Nowy plan` jak dziś.
- Krok 2: link do `/plans/new?clientId=`, nie `/plans`.
- Krok 3: przycisk kopiuj (pierwszy klient bez `portalLinkSent`).
- Preset domyślny wizarda: `4x3` (nie `6x4`).

### Panel

- Po onboardingu: KPI strip + **jedna** lista „Do zrobienia” = merge `fromClients` + `attention`, cap 8, sort po pilności (unread reply / low check-in / brak planu / cisza / out_of_order).
- „Klienci w tym tygodniu”, „Ostatnie sesje”, „Nowe rekordy” — pod foldem (kotwice KPI zostają).
- 1 primary CTA na wiersz; reszta w `OverflowMenu`.

### Karta klienta

- Hero: imię + aktywny plan + 1 status (ostatni trening albo cisza). StatBlocki 30d/PR → zakładka Wyniki.
- Wyniki: najpierw `progressReport.facts` (3) + zastój; wykresy bez zmiany kolejności poniżej.
- Badge na zakładce Historia gdy jest świeży sygnał z `fromClients` dla tego klienta (opcjonalnie, jeśli dane już na stronie).

## Model danych

Bez zmian. Merge wyłącznie na froncie z istniejących `GET /api/dashboard` (`fromClients`, `attention`).

## Kontrakt API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/dashboard` | bez zmian |
| GET | `/api/portal` link klienta | istniejący `portalUrl` / copy |
| GET | `/api/clients/{id}/progress-report` | ten sam kształt co portal (`BuildForClientAsync`) |

Ten sam DTO co `GET /api/portal/{token}/progress-report`.

## UI

- [`TrainerDashboard.tsx`](apps/web/components/TrainerDashboard.tsx)
- [`plans/new/page.tsx`](apps/web/app/(app)/plans/new/page.tsx) — `presetId` default `4x3`
- [`clients/[id]/page.tsx`](apps/web/app/(app)/clients/[id]/page.tsx)
- Prymitywy: `Button`, `OverflowMenu`, `StatBlock`, `EmptyState`

## Fazy implementacji

- [x] Faza 1 — onboarding CTA + preset + kopiuj link
- [x] Faza 2 — jedna kolejka + 1 CTA/wiersz
- [x] Faza 3 — karta klienta: hero + Wyniki od faktów

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Merge duplikuje osobę w kolejce | Dedup po `clientId`; silniejszy sygnał wygrywa |
| Mniej widoczne rekordy na Panelu | Kotwica KPI + sekcja pod foldem |
| Brak progress-report u trenera | Endpoint lustrzany do portalu; ten sam `BuildForClientAsync` |

## Changelog

- 2026-08-12 — utworzono spec (guided onboarding, inbox, odejmowanie karty klienta).
- 2026-08-12 — wdrożono: guided CTA, preset 4×3, kolejka „Do zrobienia”, hero klienta bez StatBlocków (KPI w Wynikach).
- 2026-08-12 — copy: kolejka „Wymaga Ciebie” → „Do zrobienia” (skill `ux-writing`; kalka *Requires you*).
- 2026-08-12 — Wyniki: 3 fakty z `GET /api/clients/{id}/progress-report` (ten sam `BuildForClientAsync` co portal) + zastój.
