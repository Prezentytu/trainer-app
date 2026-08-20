# Landing z mocka Designera (wyśrodkowany hero + para pod H1)

## TLDR

Landing `/` przechodzi na kompozycję z mocka Designera: nav w hero, **wyśrodkowany H1**, jeden CTA, linia faktów, a pod nimi **para Ty / Podopieczny** (panel trenera w ciemnej ramce + telefon). Sekcje spadają do czterech (01 Produkt, 02 Ile tracisz, 03 Cennik, 04 Pytania) w siatce `1fr / 1.4fr` z kreską u góry. Sekcja **01 Raport wypada**. Ciemny pas zostaje tylko na 02. Konwersja nie przełącza widoku na `/` — CTA prowadzi na `/wdrozenie`, gdzie pierwszym kadrem jest formularz z mocka.

## Problem

Poprzedni układ (spec [2026-08-19-landing-dwie-powierzchnie.md](2026-08-19-landing-dwie-powierzchnie.md)) trzymał copy i parę produktu w splicie `0.56fr / 1.44fr`. Efekty:

- H1 walczył o szerokość z ekranem panelu — na `lg` obie dominanty stały obok siebie.
- Telefon leżał w tej samej komórce Grid co panel (`mt-64`, `justify-self-end`) — kompozycja trzymała się na ręcznie dobranym marginesie, wrażliwa na każdą zmianę wysokości wiersza.
- Sześć sekcji z wielkimi ghost-numerami (`SectionIndex`, `clamp(3.5rem,8vw,5.5rem)`) plus trzy ciemne pasy (01 / 03 / 05) dawały rytm cięższy niż jedna robota strony.
- 01 Raport powtarzał to, co para w hero już pokazuje: listę z PR i spadkami.

Mock Designera odpowiada na to jednym kadrem: H1 na środku, pod nim para jako dowód, dalej cztery sekcje bez ozdobnych numerów.

Drugi problem: mock przełącza `/` na formularz przez `setState`. Tego nie shipujemy — psuje przycisk wstecz, odświeżenie, kampanie i analytics.

## Proponowane rozwiązanie

Mock = układ i copy. Tokeny, a11y i głos zostają z `design-system` / `odejmowanie` / `ux-writing`. Zero hexów, cieni, gradientów, nowej biblioteki motion.

### Hero

- Nav w hero (nie sticky): wordmark + kotwice od `lg:` + pigułka „Zaloguj się”.
- Kotwice w **kolejności strony**: Produkt → Ile tracisz → Cennik → Pytania. Mock ma Cennik przed Ile tracisz; na produkcji nav = IA, żeby wayfinding nie kłamał. `#raport` wypada.
- H1 wyśrodkowany, jeden blok, `max-w-[19ch]`, `clamp` do 72 px, leading 0.94, tracking −0.04em.
- Jeden CTA, pod nim linia caps `0 zł · bez karty · 24 godziny`. Eyebrow i osobny sub „Za 0 zł, w 24 godziny.” wypadają — hak siedzi w linii pod CTA.

### Para Ty / Podopieczny

Nowy `HeroStage` zastępuje `DualSurfaces`. Bez `transform: scale` całej scenografii (mock skaluje kadr 1044 px — u nas przy 360 px telefon zszedłby do ~60 px i tekst pod 12 px).

| Szerokość | Układ |
|---|---|
| 360–767 | stack: panel pełną szerokością (bez raila, wiersze naturalnej wysokości), pod nim telefon 220 px |
| `md` 768 | stack, panel z railem ikon `w-12`, telefon 240 px |
| `lg` 1024+ | rząd `items-end`, `max-w-[1044px]`: ramka panelu `flex-1` (ekran `aspect-[800/453]`) + telefon 200 px, `gap-10` |

- Ramka panelu: `surface-sunken` + hairline, padding jak w mocku, caps `REPMAXER` pod ekranem.
- Etykiety `Ty` / `Podopieczny` pod obiektami — przy `items-end` obie linie same się zgrywają.
- Panel: rail ikon 68 px (`lg`), nagłówek `Klienci` + `Dane przykładowe · 12 aktywnych`, kolumny `Podopieczny / Ostatnia seria / Trend`, **8 wierszy z mocka**.
- Telefon: jasny ekran, Dynamic Island, `Plan od Adama`, `Środa · Push`, `2/4 · 24:31`, Zakończ, pasek postępu, cztery serie, dock przerwy, pigułka tabów.
- Ruch: istniejący zegar `productDemo` — start w kadrze, `prefers-reduced-motion` = stan końcowy, stałe wysokości (zero layout shift). Telefon odhacza serie → wiersz Michała dochodzi do `105,0 kg × 3` + PR.
- Oba mocki: `role="img"` + `aria-label`, `pointer-events-none`, `select-none`.

### Sekcje

Nowy prymityw `SectionSplit` zamiast `SectionHead` / `SectionIndex` / `SectionIntro`: kreska u góry, `pt-10`, siatka `minmax(0,1fr) minmax(0,1.4fr)` z `gap-20` od `lg`. Lewa kolumna: caps `01 · Produkt` (+ H2 i lead, gdy sekcja ich ma). Prawa: treść.

| Sekcja | Treść |
|---|---|
| 01 Produkt | H2 z mocka + trzy kroki. Bez leada. |
| 02 Ile tracisz | Ciemny pas. H2 + lead po lewej, kalkulator po prawej. |
| 03 Cennik | H2 + 39 / 99 + `Pierwszy raport i 90 dni za 0 zł. Bez karty.` + CTA. Bez „Wolę bez rozmowy”. |
| 04 Pytania | Jasna. Po lewej tylko caps. Akordeon FAQ bez zmian (a11y zostaje). |
| Closer | Bez indexu i caps: H2 `Pierwszy raport masz jutro.` + lead + CTA + `0 zł · bez karty · 5 miejsc`. |

Ciemny pas **tylko** na 02. FAQ i closer jasne — jak mock.

`LANDING_CAPS` wraca na Geist Mono (mock + `design-system`: caps-labelki to mono). `LANDING_SECTION_H2` schodzi z 46 px / 700 na 40 px / 600 / `max-w-[20ch]`.

### Konwersja: `/wdrozenie`, nie widok na `/`

Wzorzec Linear / Attio: homepage sprzedaje, CTA idzie na jeden stały URL. Landing już sprzedał mechanizm, stratę i 39 zł, więc stack Hormoziego nie ma stać między klikiem a submitem.

- Wszystkie CTA → `/wdrozenie` (ten sam URL co dziś, stare linki żyją).
- Pierwszy kadr `/wdrozenie` = formularz z mocka: „Wróć”, caps `24 godziny · 0 zł · 5 miejsc`, H1, lead, cztery pola z kreską u dołu, jeden primary, zdanie o mailu, ekran sukcesu z trzema krokami.
- Ścieżka pieniędzy, kroki, `ReviewProof`, stack, 2 900 zł i FAQ **schodzą pod formularz**, za kreską.
- Backend bez zmian: `api.founding.apply`, track `whiteglove` / `personal`, `?status=ok`.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`apps/web/components/landing/`: `Hero`, `HeroStage` (nowy), `TrainerPanel`, `SessionPhone`, `productDemo`, `LandingNav`, `HowItWorks`, `LossCalculatorSection`, `PricingSection`, `Faq`, `FinalCta`, `LandingFooter`, `LandingPage`, `primitives`.

Kasujemy: `DualSurfaces`, `TrainerPreview`, `ReportRows`, `reviewPreview`.

`apps/web/app/wdrozenie/`: `page.tsx` + `WdrozenieForm.tsx`. Nowe ikony w `components/Icon.tsx`: `cell-signal-full`, `battery-high` (status bar telefonu — zero surowego `ph ph-*` w komponentach).

Supersede: [2026-08-19-landing-dwie-powierzchnie.md](2026-08-19-landing-dwie-powierzchnie.md) (hero, para, 01) i [2026-08-19-landing-mockup.md](2026-08-19-landing-mockup.md) (belka, numeracja sekcji) tam, gdzie mock je zmienia. Locked copy z [2026-08-19-copy-sprzedazowe-landing.md](2026-08-19-copy-sprzedazowe-landing.md) zostaje: H1, CTA, cennik, gwarancja.

## Fazy implementacji

- [x] Faza 1 — spec + IA w skillu `odejmowanie`
- [x] Faza 2 — hero wyśrodkowany + `HeroStage` (panel, telefon, 8 wierszy)
- [x] Faza 3 — sekcje 01–04 + closer; kasacja 01 Raport
- [x] Faza 4 — `/wdrozenie`: formularz w pierwszym kadrze
- [x] Faza 5 — lint / typecheck / build + QA 360 / 768 / 1280

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Skalowanie kadru 1044 px z mocka daje tekst pod 12 px | Realne rozmiary tokenów; kompozycja responsywna, nie `transform: scale` |
| Panel 8 wierszy nie mieści się w `aspect-[800/453]` | Wiersze `flex-1 min-h-0`, lista `overflow-hidden`, 13 px nazwa / 12 px sub |
| Telefon z dockiem i tabami nie mieści się przy 176 px | Telefon 200 px na `lg`, 220–240 px w stacku |
| Kasacja 01 Raport zabiera „Do wysłania” z landingu | Wiadomości żyją w ofercie na `/wdrozenie`; hero pokazuje sygnały |
| Formularz na górze `/wdrozenie` zabiera kontekst oferty | Ścieżka pieniędzy i stack zostają pod formularzem, za kreską |
| Kolejny agent przywróci stary hero z poprzedniego specu | IA i sygnatura zaktualizowane w skillu `odejmowanie` |

## Changelog

- 2026-08-20 — utworzono spec i wdrożono: wyśrodkowany hero, `HeroStage`, cztery sekcje, formularz jako pierwszy kadr `/wdrozenie`.
