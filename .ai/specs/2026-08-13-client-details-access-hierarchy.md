# Hierarchia strony szczegółów klienta

## TLDR

Strona klienta rozdziela codzienną pracę (plan, sesje, wyniki) od konfiguracji setup-once (PIN, ważność linku, WhatsApp). Status i aktywny plan idą na górę; dostęp do portalu schodzi na dół, zwinięty.

## Problem

Profil klienta miesza dwa tryby: coaching (czy trenował, otwórz plan, wpisz trening) i ustawienia, które trener ustawia raz. Karta „Link i WhatsApp” stoi nad aktywnym planem i zakładkami — najrzadziej używana rzecz zajmuje najlepsze miejsce. Nagłówek dubluje kopiowanie/wysyłkę linku, a ostrzeżenie o braku e-maila wisi luźno, z dala od kontrolek, których dotyczy.

## Proponowane rozwiązanie

Odwrócona piramida uwagi (Hick, progressive disclosure, F-pattern):

1. Nagłówek: avatar, imię, e-mail/notatka. Jedna akcja: „Skopiuj link dla klienta”.
2. Aktywny plan — pierwsza treść pod nagłówkiem (bez zmian merytorycznych).
3. Zakładki Plany / Historia / Wyniki / Notatki / Wywiad — bez zmian.
4. Zwinięta sekcja „Dostęp do portalu” na dole, nad „Usuń klienta”. Lazy-load `accessToken` przy pierwszym rozwinięciu. Hint o e-mailu przy kontrolkach wysyłki.
5. „Usuń klienta” — bez zmian.

Bez zmiany kontraktu API. `hasPortalPin` z `ClientDetails` wystarcza na meta w stanie zwiniętym.

## Model danych

Bez zmian schematu / migracji.

## Kontrakt API

Bez zmian. Istniejące:

| Metoda | Ścieżka | Użycie |
|---|---|---|
| GET | `/api/clients/{id}/access-token` | lazy przy rozwinięciu + kopiowanie linku |
| POST | `/api/clients/{id}/access-token/expire` | ważność linku |
| POST | `/api/clients/{id}/portal-pin` | PIN |
| POST | `/api/clients/{id}/send-portal-link` | e-mail z linkiem |

## UI

- [apps/web/app/(app)/clients/[id]/page.tsx](apps/web/app/(app)/clients/[id]/page.tsx) — kolejność sekcji, odchudzony nagłówek.
- [apps/web/components/client/PortalAccessSection.tsx](apps/web/components/client/PortalAccessSection.tsx) — zwijana sekcja (wzorzec jak `CheckInCard` / `TrainerNotesTab`).
- [apps/web/components/skeletons.tsx](apps/web/components/skeletons.tsx) — `ClientDetailSkeleton` 1:1 z nowym layoutem (header + pasek planu + zakładki, bez karty linku).
- Prymitywy: `Button`, `Field`, `inputClass`, `Icon` (`caret-down`), `ErrorBanner`. Tokeny `--dur-med` / `--ease-out`.

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — `PortalAccessSection` + przebudowa strony + skeleton
- [x] Faza 3 — lekcja + lint / typecheck / build

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Trener szuka PIN-u na górze | Meta w zwiniętym wierszu na dole („PIN ustawiony” / „Bez PIN-u”); kopiowanie linku zostaje w nagłówku |
| Extra request access-token na każdą wizytę | Lazy przy pierwszym rozwinięciu |
| Select ważności gubi dokładną datę | Hint z `expiresAt` po załadowaniu; opcje 30 / 90 / 365 / bez daty bez zmian |

## Changelog

- 2026-08-13 — utworzono spec; decyzja: setup-once na dół i zwinięte, hero = status + aktywny plan, bez zmiany API.
- 2026-08-13 — wdrożono: `PortalAccessSection` (lazy `accessToken`), nagłówek z jednym CTA, aktywny plan pod hero, skeleton 1:1.
