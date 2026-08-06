# Pre-launch hardening — MVP dla design partners

## TLDR

Parytet ze Styrką jest domknięty. Przed early access dla zaproszonych trenerów domykamy gotowość produkcyjną: ikony offline w PWA, noindex portalu z tokenem, fail-fast auth, handler błędów + rate limit, zoom WCAG, minimum prawne (polityka/regulamin/eksport), ops (logging, backup, docs) oraz dwie luki produktowe (edycja daty sesji, CSV z seriami).

Cel: darmowy early access. Billing i pełny regulamin komercyjny poza zakresem.

## Problem

Audyt vs Styrka + przegląd senior/designer wykazał, że ficzery treningowe nie blokują premiery. Blokują:

1. Ikony Phosphor z CDN (`unpkg`) — SW cache'uje tylko same-origin → offline w hali = puste ikony w loggerze.
2. Portal `/portal/[token]` bez `noindex` / `robots.txt` — token w URL może wyciec do indeksu.
3. API w Production bez `Clerk:Authority` wpuszcza każdego jako lokalnego trenera.
4. Brak globalnego exception handlera; niespójny rate limit na zapisach portalu.
5. `userScalable: false` łamie WCAG 1.4.4.
6. Brak polityki/regulaminu przy danych o zdrowiu; niepełny eksport; brak usuwania konta trenera.
7. Brak structured logging / procedury backup; README nieaktualny.
8. Edycja daty sesji i CSV z seriami — jedyne sensowne luki vs Styrka przed early access.

## Proponowane rozwiązanie

1. Zwendorować font Phosphor lokalnie + precache w SW.
2. `robots` metadata + `app/robots.ts` + `X-Robots-Tag` dla `/portal/*` (bez TTL tokenów — magic link ma być trwały; rotacja już istnieje).
3. Fail-fast przy pustym Clerk w Production; `ValidateAudience = true`.
4. `UseExceptionHandler` → `{ message }` + correlation ID; `.RequireRateLimiting("portal")` na brakujących endpointach.
5. Przywrócić zoom; ewentualnie `font-size: 16px` na polach (anty auto-zoom iOS).
6. Strony `/prywatnosc`, `/regulamin` (szkielet do uzupełnienia prawnego), zgoda przy rejestracji, informacja przy wywiadzie; pełniejszy eksport; DELETE konta trenera.
7. Logging + dokumentacja backup/restore + `.env.example` + aktualizacja README.
8. UI edycji daty sesji u trenera; CSV z seriami; EmptyState w portalu; fetch share do `api.ts`.

## Model danych

Bez nowych encji. Eksport i DELETE trenera operują na istniejących relacjach (`Client`, `ClientMeasurement`, `ClientIntake`, `ClientCheckIn`, kaskady w `AppDb`).

## Kontrści API

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| GET | `/api/export` (JSON) | + pomiary, intake, check-iny; bez surowych tokenów portalu |
| GET | `/api/export/csv` | + wiersze serii (session/exercise/set) |
| DELETE | `/api/account` | Usunięcie konta zalogowanego trenera + kaskada |
| PUT | sesje (istniejące) | UI trenera ustawia `performedOn` |

## UI

- `layout.tsx` — lokalny Phosphor, zoom
- `portal/[token]/layout.tsx` — noindex + zoom
- `app/robots.ts`, `next.config.ts` — robots / X-Robots-Tag
- `/prywatnosc`, `/regulamin` + linki w landing footer i portalu
- `AuthScreen` — checkbox zgody
- portal intake — jedno zdanie o przetwarzaniu
- sesja trenera — edycja daty
- portal empty states → `EmptyState`
- `/settings`, `/plans/new` — loading/error
- `SessionSummaryView` — share przez `lib/api.ts`

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — blokery techniczne (ikony, noindex, auth fail-fast, exception handler, rate limit, zoom)
- [x] Faza 2 — minimum prawne + eksport + DELETE konta
- [x] Faza 3 — ops (logging, docs, .env.example, README)
- [x] Faza 4 — edycja daty, CSV serii, craft portalu
- [x] Faza 5 — check.sh, changelog, lekcja

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Lokalny font Phosphor — ścieżki w CSS | Weryfikacja `url()` po zwendorowaniu; precache w SW |
| ValidateAudience łamie lokalne/test JWT | Audience tylko gdy `Clerk:Audience` ustawione; testy z wyłączonym Clerk bez zmian |
| Szkielet prawny bez finalnej treści | Jawne placeholdery „[DO UZUPEŁNIENIA]"; nie blokuje early access technicznego |
| DELETE konta nieodwracalny | Potwierdzenie „USUN" w UI; cascade jak przy kliencie |

## Poza zakresem

Stripe, Sentry (wymaga zgody na zależność), cardio/RPE/weight+distance, podział monolitów loggera, offline panelu trenera, TTL tokenów portalu.

## Changelog

- 2026-08-06 — utworzono spec.
- 2026-08-06 — wdrożono: lokalny Phosphor + SW precache, noindex portalu, fail-fast Clerk w Production, exception handler + correlation ID, rate limit zapisów portalu, zoom WCAG + 16px inputy, `/prywatnosc`/`/regulamin`, zgoda przy rejestracji, pełniejszy eksport (bez tokenów) + CSV serii, DELETE `/api/account`, edycja daty sesji u trenera, EmptyState w portalu, docs/README/`.env.example`.
