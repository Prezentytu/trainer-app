# Landing i auth — minimalizm w stylu Apple

## TLDR

Przebudowa marketingowego `/` oraz ekranów `/sign-in` i `/sign-up`: sentence case, mniej sekcji, więcej powietrza, polskie etykiety w demo produktu. Paleta Acid i wordmark zostają; panel trenera bez zmian.

## Problem

Landing i auth krzyczą wersalikami, prefiksami `///`, obrysami liter, metrykami i angielsko-technicznymi napisami w demo. Na `/sign-up` nagłówek aplikacji dubluje się z nagłówkiem karty Clerka („Trainer app”). Strona nie trafia w spokojny, czytelny język korzyści.

## Proponowane rozwiązanie

- Nowa utility `.display-soft` (Archivo 700, sentence case) tylko dla landingu i auth; `.display-caps` zostaje dla wordmarku i sesji.
- Struktura: Nav → Hero → Demo → Jak to działa → Co dostajesz → Cennik → FAQ → Zamknięcie → Stopka.
- Bez kart w krokach i korzyściach; bez lime bandu na pełną szerokość; bez metryk w hero.
- Auth: uproszczony lewy panel; ukryty nagłówek karty Clerka; nadpisania lokalizacji (hasło po polsku).

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI

Pliki: `apps/web/components/landing/*`, `apps/web/components/auth/AuthScreen.tsx`, `apps/web/app/sign-in/**`, `apps/web/app/sign-up/**`, `apps/web/lib/clerkAppearance.ts`, `apps/web/components/ClerkAppProvider.tsx`, `apps/web/app/globals.css`, metadata/OG.

## Fazy implementacji

- [x] Faza 1 — token `.display-soft` + spec
- [x] Faza 2 — landing (nav, hero, demo, sekcje, cennik, FAQ, CTA, footer)
- [x] Faza 3 — auth + Clerk appearance/localization + meta

## Ryzyka i wpływ

- Ukrycie nagłówka Clerka CSS-em — przy zmianie klas SDK trzeba sprawdzić `elements`.
- `applicationName` w dashboardzie Clerka nadal może pojawić się w innych stringach; na ekranie startowym jest schowany razem z headerem.

## Changelog

- 2026-08-04 — utworzono i wdrożono spec.
- 2026-08-04 — craft: atmosfera radialna, wycentrowany hero z brandem, demo jako product shot z fade, glass nav.
- 2026-08-04 — editorial world-class: Instrument Serif, `.display-editorial`, grain, hairline grid, marquee, EarlyAccess, clip-path reveal, żywe demo serii.
