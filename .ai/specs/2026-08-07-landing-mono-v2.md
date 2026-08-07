# Landing mono v2 — marketing RepMaxer

## TLDR

Zastępujemy landing Acid nowym landingiem na tokenach **mono v2** (bez `.theme-acid`), według prototypu HTML: hero z live feedem, żywe mocki panelu/telefonu/progresu, cennik 149 zł, FAQ. Zero screenshotów, zero nowych zależności motion.

## Problem

Landing marketingowy nadal siedzi w `.theme-acid` (lime chrome, grain, marquee, screenshoty), podczas gdy aplikacja jest już na mono v2. Prototyp Design Composer definiuje spójną narrację typography-led z interaktywnymi mockami produktu — obecny landing tego nie oddaje. Spec mono epic świadomie odłożył redesign landingu na osobny krok.

## Proponowane rozwiązanie

1. Usunąć `.theme-acid` z `LandingPage` — landing używa domyślnych tokenów mono.
2. Przepisanie sekcji 1:1 z prototypem (bez marquee / scenario scroll / ProductShots):
   - sticky nav → hero + LiveFeed → panel mock → phone mock → progres → cennik → FAQ → final CTA → footer
3. Reużycie: `Wordmark`, `Button`, `Marker`, `ListRow`, `StatBlock`, `LineChart`, `Icon`, `LandingReveal`.
4. Lokalne drobne komponenty landingu: `StatTile`, `SectionLabel`, `SetRowHeader` — bez rozbudowy `ui.tsx`.
5. Cena: **149 zł/mies.** (nie 100 zł z prototypu). Copy PL; „Finish” → „Zakończ trening”.
6. Feed oznaczony jako „Podgląd” (nie fake social proof).
7. Motion: IntersectionObserver + CSS (`cubic-bezier(0.22, 1, 0.36, 1)`); `prefers-reduced-motion` wyłącza autoplay/reveale.

## Model danych

Brak zmian w bazie / encjach.

## Kontrakt API

Brak zmian API. CTA → `/sign-up`, `/sign-in` (Clerk). Linki prawne → `/regulamin`, `/prywatnosc`.

## UI

| Plik | Rola |
|---|---|
| `components/landing/LandingPage.tsx` | Shell mono, montaż sekcji |
| `LandingNav.tsx` | Sticky; kotwice sm+; CTA |
| `Hero.tsx` + `LiveFeed.tsx` | H1 + rotujący feed |
| `PanelMock.tsx` / `PhoneMock.tsx` / `ProgressCard.tsx` | Sekcje 01–03 |
| `PricingSection.tsx` / `Faq.tsx` / `FinalCta.tsx` / `LandingFooter.tsx` | Cennik, FAQ, CTA, stopka |
| `app/page.tsx` + `landing-preview` | Bez zmian montażu; metadata SEO na `/` |
| Usunięte | `Marquee`, `ScenarioScroll`, `ProductShots`, `Points`, `HeroField` + martwy CSS Acid landingu |

Skille: `design-system`, `senior-ux-cro`, `responsive-ui`, `apple-design`, `fitness-ui-ux`.

## Fazy implementacji

- [x] Faza 1 — spec + shell (LandingPage, Nav, Footer) bez Acid
- [x] Faza 2 — Hero + LiveFeed
- [x] Faza 3 — PanelMock, PhoneMock, ProgressCard
- [x] Faza 4 — Pricing, FAQ, Final CTA
- [x] Faza 5 — cleanup starych komponentów/CSS + SEO + bramka

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Content stranded at opacity 0 (reveal) | Fail-open: reduced-motion = od razu widoczne; IO + scroll sweep jak w prototypie |
| Fake social proof w feedzie | Label „Podgląd”; dane przykładowe w copy |
| Mobile nav zbyt gęsta | Kotwice `hidden sm:flex`; wordmark + CTA zawsze |
| `.theme-acid` używane gdzie indziej | Usunięto blok CSS; Auth zostaje na `display-landing-xl` |

## Changelog

- 2026-08-07 — utworzono spec (cena 149 zł, zakres strict 1:1 z prototypem).
- 2026-08-07 — wdrożono landing mono v2; usunięto `.theme-acid`, stare sekcje Acid i `public/landing/` screenshots.
- 2026-08-07 — polish 10/10: ProgressCard z H2 + grid 1.55fr/1fr + divide-y, większy padding kart, wyrównanie ListRow, spójny cast imion + „Dane przykładowe”, LiveFeed bez remount/aria-live.
- 2026-08-07 — korekta kompozycji: hero `items-start` (subcopy przy H1), sekcja 02 jako split (punkty 04–06 obok telefonu), dedykowany `ProgressChart` bez kolizji liczb (gold dot = PR, bez konfliktu 143 vs 142,5), delta StatTile inline w linii wartości.
- 2026-08-07 — hero na jednej osi (wzorzec Feji Studios): blok tekstu H1→subcopy→CTA wyśrodkowany w pionie, feed pełnoszerokościowy na dole hero z maską fade-to-black („horyzont danych”); wiersze feedu w 3 kolumnach na sm+ (nazwisko | ćwiczenie | wynik).
- 2026-08-07 — jedna reguła osi na całej stronie: momenty deklaracji (hero, finalne CTA) to wyśrodkowany blok z tekstem do lewej (`sm:mx-auto sm:w-fit`), sekcje numerowane 01–05 zostają na osi lewej, a wszystkie bloki treści mają pełną szerokość kontenera (FAQ bez `max-w-[800px]`, telefon w torze siatki `380px` zamiast `justify-self-center`). Cena rozbita na `0` + `zł`, bo spacja w foncie mono robiła dziurę.
