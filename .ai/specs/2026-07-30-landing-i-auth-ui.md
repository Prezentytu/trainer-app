# Landing i auth UI

## TLDR

Profesjonalna strona powitalna na `/` dla niezalogowanych oraz markowe ekrany logowania/rejestracji (split-screen, komponenty Clerka ostylowane tokenami WA, po polsku). Naprawiamy przekierowanie na hostowany Account Portal Clerka.

## Problem

Przy włączonym Clerku wejście na domenę kończy się generycznym ekranem `*.accounts.dev` („Sign in to Trainer app", „Secured by Clerk", „Development mode"). Przyczyna: `auth.protect()` bez `signInUrl` / `unauthenticatedUrl`. Dodatkowo brak strony marketingowej — `/` to od razu Panel trenera.

## Proponowane rozwiązanie

1. `/` publiczne; serwerowo: niezalogowany → landing, zalogowany → Panel (bez zmiany URL-i).
2. `AppShell` tylko w grupie tras `(app)`; portal i auth mają własne layouty.
3. Hybrid auth UI: własny split-screen + osadzony `<SignIn />` / `<SignUp />` z `appearance` (tokeny WA) i `plPL` z `@clerk/localizations`.
4. Middleware: `unauthenticatedUrl → /sign-in`; `ClerkProvider` z `signInUrl` / `signUpUrl`.

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

| Trasa | Widok |
|---|---|
| `/` (niezalogowany) | Landing (nav, hero, preview, wyróżniki, jak to działa, dane, FAQ, CTA, footer) |
| `/` (zalogowany / lokal) | Panel trenera w `AppShell` |
| `/sign-in`, `/sign-up` | `AuthScreen` split-screen + Clerk |

Prymitywy: `Card`, `Button`, `Badge`, `Avatar`, `StatBlock`, `EmptyState`. Kolory wyłącznie tokeny semantyczne; hexy tylko w `lib/clerkAppearance.ts` (lustro `globals.css` dla SDK Clerka).

## Fazy implementacji

- [x] Faza 1 — auth fix + restrukturyzacja layoutów + `TrainerDashboard`
- [x] Faza 2 — branding Clerka + ekrany sign-in/sign-up
- [x] Faza 3 — landing + SEO + docs + walidacja

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Migotanie landing↔panel | Decyzja w server component przez `auth()` |
| Panel na `/` bez Bearer | `AuthTokenBridge` na zewnątrz `Guard` |
| `var()` w appearance psuje skale Clerka | Hexy lustrzane do tokenów w jednym pliku |
| Zmiana ścieżek przy `git mv` | Grupa `(app)` — URL-e bez zmian |

## Changelog

- 2026-07-30 — utworzono spec (decyzje: same-root routing, hybrid Clerk UI, `@clerk/localizations` plPL).
- 2026-07-30 — wdrożono: landing, AuthScreen, middleware/ClerkProvider, `(app)` layout.
