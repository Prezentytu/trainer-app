# Landing: dwie powierzchnie od pierwszego kadru

## TLDR

Hero na `/`: copy z lewej, z prawej **jedna historia na dwóch ekranach** — panel trenera (dominanta) + telefon podopiecznego (dopełnienie). Odhaczona seria na telefonie aktualizuje wiersz Michała w panelu. Bez leada, belki, stat i `min-h-svh`. Kotwica `#produkt` ląduje na parze. 01 = jeden artefakt raportu. 02 = tylko 3 kroki.

## Problem

Test 5 sekund: FiziYo od razu podpisuje panel i apkę pacjenta. Lead, CTA-belka i trzy staty pod H1 zjadały kadr, a para siedziała pod foldem jako lista raportu — nie jako panel. Później `min-h-svh` i równy split 1:1 znowu ściskały produkt: na telefonie pierwszy kadr to prawie sam tekst, na niskim laptopie para walczy o viewport, a dwa mockupy tykały niezależnie.

## Proponowane rozwiązanie

Locked GTM: H1, sub, CTA, IA 01–06. Lead i belka zostają poza kadrem (24 h / 0 zł w sub; mechanizm w 02; 5 miejsc w cenniku).

### Benchmarki (przenieść wzorzec, nie look)

| Źródło | Bierzemy | Nie bierzemy |
|---|---|---|
| Eleken | Duży, czytelny crop prawdziwego UI; jedna dominanta; 1 CTA | Logo wall, testimonial wall, hue w chrome, katalog sekcji |
| Quo / Todoist | Szeroki desktop jako baza, telefon na dole-prawo, ta sama historia, 1 CTA | Hue, pochylenie, logo wall, dwa CTA, overlap na żywym wierszu Michała |
| Routine / Superset | Desktop = decyzja trenera, telefon = wykonanie | Katalog funkcji, karuzele, trzecia pływająca karta |
| Superhuman / Attio | Produkt jako dowód obietnicy; skala i realne dane | Fake metryki, proof sections |

### Hero

- Hero ma `lg:min-h-svh`; panel nie ma arbitralnego `min-h`. Od `lg:` jest pełnym ekranem `aspect-[16/10]`, nie paskiem ani kwadratem.
- Od `lg:` siatka `0.56fr / 1.44fr`. Panel i pełny telefon leżą w tej samej komórce CSS Grid. Telefon zaczyna się pod wierszami z PR i zielonym progresem (`mt-64`), więc scena sama ustala wysokość — bez `absolute`, arbitralnego `top` i cropa.
- Copy: eyebrow → H1 (2 takty, leading 1.08; dominanta słowna) → sub (mniejszy stopień) → 1 CTA.

### Para Ty / Podopieczny — jedna historia

Wspólny zegar w `productDemo.ts`. Telefon odhacza serie wyciskania; wiersz Michała w panelu idzie od „seria w toku” do `105,0 kg × 3` + PR. Zegar startuje, gdy para wejdzie w kadr. `prefers-reduced-motion` = stan końcowy od razu. Bez nowej biblioteki; tylko `transform` / `opacity`.

**Ty** — `TrainerPanel`: na mobile wysokość = treść; od `lg:` ekran 16:10. Sidebar `w-44` od `lg:`, rail `w-12` na `md`. Pięć wierszy rozkłada się na całą wysokość ekranu. Lista hero ≠ zoom 01 (Marta i Ola zostają w 01).

**Podopieczny** — pełny `SessionPhone` size `hero`, `aspect-[393/852]`. W hero: inset `p-2`, siatka serii `14 / 1fr / 1fr / 28`, kółko 20 px. Bez docka przerwy w hero; pełny dock tylko w `default`. Light frame — bez cienia, obrotu i ucięcia ramki.

Etykiety caps przy obiektach: `Ty` nad lewym górnym rogiem panelu, `Podopieczny` nad telefonem. Bez leada pod parą.

### Wymiary i breakpointy

| Szerokość | Siatka | Panel | Telefon |
|---|---|---|---|
| 360–400 | 1 kol., copy potem para | pełna szerokość, bez min-h, bez raila, wiersze `min-h-12` | 188 px **pod** panelem |
| `md` 768 | 1 kol. | rail `w-12`, wiersze 56 px | 200 px pod panelem, `gap-10` |
| `lg` 1024 | `17rem/0.56fr` \| `1.44fr`, gap 48 | pełna szerokość, ekran 16:10, sidebar `w-44` | pełny 160 px, ten sam grid-cell, `mt-64`, `mr-4` |
| `xl` 1280+ | gap 64 | ekran 16:10 wypełnia prawą kolumnę | pełny 176 px, ten sam grid-cell, `mt-64`, `mr-5` |

Nav hero: `h-20`. H1: `clamp(2.25rem, 4.8cqi, 3rem)` / leading 1.08. Sub: `clamp(1.25rem, 2vw, 1.5rem)`. PR Michała i zielony progres Tomasza w całości odkryte. Checkboxy w ramce. Zero poziomego scrolla.

### 01 i 02

- 01: zoom `REVIEW_ROWS` (3 sygnały) + „Do wysłania” w **jednym** artefakcie (`surface` + hairline). CTA poza artefaktem. Bez nowego copy.
- 02: trzy kroki. Bez drugiego panelu i bez drugiego telefonu.

Supersede [2026-08-19-landing-mockup.md](2026-08-19-landing-mockup.md) w hero (skład, `min-h-svh`, belka).

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`apps/web/components/landing/`: `Hero`, `DualSurfaces`, `productDemo`, `TrainerPanel`, `SessionPhone`, `TrainerPreview`, `ReportRows`, `HowItWorks`. Nav w kolejności IA: Raport → `#raport` (01), Produkt → `#produkt` (02), Ile tracisz → `#ile-tracisz` (03). Skill `odejmowanie`: sygnatura = ekran panelu 16:10 + pełny telefon w tej samej komórce siatki, obok H1.

## Fazy implementacji

- [x] Faza 1 — spec + skill
- [x] Faza 2 — para w hero + wyjęty telefon
- [x] Faza 3 — 02 tylko kroki; kasacja panelu
- [x] Faza 4 — lint / typecheck + QA 360/768/1280 (split od `lg:`, para 2-kol. na `md` i `xl`)
- [x] Faza 5 — copy nad parą, złoty podział, pełny panel, iPhone overlap
- [x] Faza 6 — układ FiziYo (copy \| panel + telefon), stała ramka iPhone
- [x] Faza 7 — para bez overlapu, split od `xl`, wspólny timeline, artefakt 01

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Para + 01 = ten sam raport trzy razy | Hero = `HERO_ROWS` (Michał live + inni). 01 = `REVIEW_ROWS` (3 sygnały) + „Do wysłania” + CTA |
| Hero wygląda jak przypadkowy fragment strony | `lg:min-h-svh`; scena wyśrodkowana w pozostałym miejscu pod navem |
| Pełny sidebar rozpycha mobile | Rail od `md:`; mobile = 5 wierszy bez raila |
| Telefon zasłania markery / serie wychodzą z ramki | Telefon jest pełny i w normalnym flow siatki; bez cropa. Hero: bez docka, siatka `14/1fr/1fr/28` |
| Autoplay leci pod foldem i rozpycha layout | Zegar startuje w kadrze; stały aspect; reduced-motion = finisz |
| Dwa niezależne mockupy | Jeden zegar: seria na telefonie → wiersz Michała w panelu |
| Krok 03 znowu o wdrożeniu | Kroki łączą role: wysyłasz → link → raport |

## Changelog

- 2026-08-19 — utworzono spec.
- 2026-08-19 — split: copy \| panel + telefon. Lead i belka wyjęte z kadru. `TrainerPanel` zamiast gołych wierszy.
- 2026-08-19 — copy nad parą (złoty podział H1 \| sub+CTA). Pełny panel (rail od `md:`, 5 wierszy). iPhone nachodzi z prawej od `lg:`.
- 2026-08-19 — układ FiziYo: copy obok pary. Telefon `absolute` na krawędzi okna, stała ramka (bez skoku przy autoplay).
- 2026-08-19 — hero `min-h-svh`, siatka 1:1, typografia telefonu zagęszczona do ramki.
- 2026-08-19 — benchmarki Eleken/Craft/Granola: bez `min-h-svh`, split 42/58, wspólny timeline, overlap tylko `lg`/`xl`, 01 jako jeden artefakt.
- 2026-08-19 — overlap skasowany: telefon ma własne pole. Split copy/para od `xl`. Większy `py` i `gap`.
- 2026-08-19 — kotwice = kolejność IA (Raport/Produkt/Ile tracisz). H1 dwa takty z leading 1.12. Pełny panel + telefon na dole-prawo.
- 2026-08-19 — wymiary Quo/Eleken: panel bez min-h, telefon 196–220 px zwisa z rogu, dock ukryty w hero, H1 leading 1.22.
- 2026-08-19 — korekta kadru: pełny telefon 160–176 px, zero absolute/cropa; panel i telefon w jednej komórce Grid. Usunięto „Dane przykładowe”.
- 2026-08-19 — korekta proporcji: panel od `lg:` ma ekran 16:10; sidebar i pięć wierszy wypełniają jego wysokość.
- 2026-08-19 — korekta hierarchii: H1 36–48 px / leading 1.08; telefon niżej, bez zasłaniania PR i zielonego progresu.
