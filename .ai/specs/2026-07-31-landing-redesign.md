# Redesign landingu — język trenera

## TLDR

Przebudowa marketingowego `/` w `apps/web`: język trenera (zero żargonu programisty), minimum tekstu, pokaz produktu jako żywe demo (panel + telefon), craft Awwwards w ramach istniejącego design systemu WA. Landing zostaje 2-w-1 (gość → landing, zalogowany → Panel). Social proof: uczciwy wczesny dostęp, bez zmyślonych testimoniali.

## Problem

Obecny landing mówi „logger sesji”, „tarcie”, „lock-in”, „Composer”, „JSON/CSV” — trener personalny tego nie kupuje. Sekcje są zbyt gadatliwe; brak signature momentu produktowego.

## Proponowane rozwiązanie

- Zostajemy w `apps/web` na `/` (bez osobnego deployu).
- Skrócona struktura: Hero → Product demo → Bento korzyści → Jak to działa → FAQ → CTA finałowe.
- Usunięcie sekcji `DataOwnership` (treść → FAQ + trust line).
- Copy efektowy, nie cechowy; jedno CTA „Zacznij za darmo”.
- Motion: CSS keyframes + IntersectionObserver; bez nowych zależności (bez GSAP/Lenis).

## Model danych

Brak zmian.

## Kontrakt API

Brak zmian.

## UI — struktura i finalny copy

### Nawigacja (`LandingNav`)

- Kotwice (max 3): Co zyskujesz (`#korzysci`) · Jak to działa (`#jak-to-dziala`) · FAQ (`#faq`)
- CTA: „Zacznij za darmo” → `/sign-up`; secondary „Zaloguj się”
- Sticky: `bg-surface/80` + blur

### Hero

- Eyebrow: `Dla trenerów personalnych`
- H1: `Plany, które klienci **robią**.` (rotujące: robią / kończą / czują; reduced-motion → tylko „robią”)
- Lead: `Ułóż plan w kilka minut i wyślij klientowi link. On trenuje w telefonie, Ty widzisz każdy trening.`
- Primary CTA: `Zacznij za darmo`
- Secondary: `Zobacz jak to działa` → `#jak-to-dziala`
- Trust: `Za darmo we wczesnym dostępie · Bez karty · Klient nie instaluje żadnej aplikacji`

### Pokaz produktu (`PanelPreview`) — signature moment

- Etykieta mono: `01 / PRODUKT`
- Duet: panel trenera (klienci + status) + telefon klienta (logowanie serii)
- CSS pętla: serie odhaczają się; status klienta → „ukończył trening”
- Mockupy HTML (nie PNG)

### Korzyści — bento (`Differentiators`, `#korzysci`)

- Etykieta: `02 / KORZYŚCI`
- H2: `Mniej arkuszy. Więcej coachingu.`
- Duża karta: tytuł `Klient klika link i trenuje`, body `Bez konta i bez sklepu z aplikacjami. Otwiera link na telefonie i loguje serie.`
- Mała 1: `Plan w kilka minut` — `Układaj treningi jak w notatniku. Serie, przerwy i ciężary w jednym miejscu.`
- Mała 2: `Widzisz, kto trenuje` — `Panel pokazuje wykonanie i ciszę. Interweniujesz, zanim klient zniknie.`

### Jak to działa (`HowItWorks`)

- Etykieta: `03 / START`
- H2: `Trzy kroki do pierwszego treningu`
- `01` Dodaj klienta — `Imię wystarczy na start.`
- `02` Ułóż plan — `Szablon albo własny układ — i gotowe.`
- `03` Wyślij link — `Klient trenuje w telefonie. Ty widzisz wynik.`

### FAQ

1. Czy klient musi coś instalować? → Nie. Dostaje link do portalu w przeglądarce. Może dodać skrót na ekran — bez sklepu z aplikacjami i bez konta.
2. Czy działa na siłowni bez zasięgu? → Portal zapisuje trening lokalnie i dogrywa, gdy wróci sieć.
3. Ile to kosztuje? → We wczesnym dostępie — za darmo, bez karty. Gdy pojawi się cennik, będzie prosty i przewidywalny.
4. Czy mogę zabrać swoje dane? → Tak. Z Panelu eksportujesz klientów, plany i historię treningów jednym kliknięciem.
5. Czy potrzebuję aplikacji na telefon? → Nie. Pracujesz w przeglądarce na komputerze lub tablecie.

### CTA finałowe (`CtaBand`)

- H2 (skala hero): `Przestań wysyłać PDF-y.`
- Lead: `Załóż konto, dodaj klienta, wyślij link. Za darmo we wczesnym dostępie.`
- CTA: `Zacznij za darmo` (+ ghost „Mam już konto”)

### Auth + OG

- AuthScreen: ten sam język co hero (bez „logger”).
- OG / metadata: `Plany, które klienci robią.` · `Ułóż plan, wyślij link, widzisz każdy trening.`

### Zakazane słowa

tarcie, logger, lock-in, onboarding, composer, inline, magic-link, JSON/CSV, soft PT, retencja (jako rzeczownik UI).

## Fazy implementacji

- [x] Faza 0 — spec (ten dokument)
- [x] Faza 1 — Hero + motion base (CSS) + Nav/Footer
- [x] Faza 2 — Product demo + bento + HowItWorks + FAQ + CtaBand; usunięcie DataOwnership
- [x] Faza 3 — AuthScreen + OG/metadata + bramka walidacyjna

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Animacje męczą / a11y | `prefers-reduced-motion` wyłącza rotator i pętlę demo |
| Zbyt dużo ruchu na weak devices | tylko `transform`/`opacity`; bez bibliotek |
| Copy zbyt „marketerski” | checklista zakazanych słów + review język trenera |

## Changelog

- 2026-07-31 — utworzono spec; decyzje: 2-w-1, wczesny dostęp bez fake proof.
- 2026-07-31 — wdrożono redesign landingu (Hero + demo produktu + bento + FAQ + CTA; usunięto DataOwnership; Auth/OG spójne; bramka zielona).
