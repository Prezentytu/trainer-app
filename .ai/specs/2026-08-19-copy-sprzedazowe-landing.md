# Copy sprzedażowe — landing i `/wdrozenie`

## TLDR

Teksty landingu i `/wdrozenie` sprzedają hak (raport tygodnia za 0 zł w 24 h), nie klimat. Deliverable nazywamy **raportem**, nie przeglądem. H1: oferta (co + cena + czas). CTA: **Zamów darmowy raport**. Każda sekcja niesie inny argument. Formularz na `/wdrozenie` stoi nad stackiem i kotwicą 2 900 zł.

## Problem

H1 „Wiesz w niedzielę, do kogo napisać.” nie mówi, czym jest produkt. „Odbierz pierwszy przegląd” brzmi jak przegląd samochodu. Hak 0 zł, gwarancja, drabina 0 → 390 i rachunek 1 200 zł vs 39 zł były schowane. Triada „kto stanął / komu spadły / kto się nie odezwał” powtarzała się bez eskalacji. `/wdrozenie` karało ciepły klik: formularz za jedenastoma blokami, 2 900 zł tuż przed nim.

## Proponowane rozwiązanie

### Nazewnictwo (locked)

| Rola | Tekst |
|---|---|
| Deliverable | raport / raport tygodnia |
| CTA | Zamów darmowy raport |
| Eyebrow | Dla trenerów personalnych |
| H1 `/` | Wszyscy podopieczni w jednym raporcie. / Za 0 zł, w 24 godziny. |
| H1 `/wdrozenie` | Pierwszy raport z Twoich podopiecznych — za 0 zł, w 24 godziny. |

Zakaz: niedziela, „kończy”, „do kogo napisać”, „Odbierz pierwszy przegląd”, animacja `HeroNiedziele`. H1 = oferta wprost (Hormozi / YC), nie zagadka.

### Landing `/` — eskalacja argumentów

1. Hero — kategoria + wynik + hak 0 zł + scarcity z powodem
2. **01 Raport** (ciemny) — artefakt; lead = projekcja jutra; CTA pod artefaktem
3. **02 Produkt** (jasny) — telefon podopiecznego; H2 sprzedaje zero wysiłku
4. 03 Ile tracisz — most: sygnały widać w raporcie dwa tygodnie wcześniej
5. 04 Cennik — no-brainer 1 200 zł vs 39 zł + ścieżka pieniędzy w trzech zdaniach
6. 05 Pytania — obiekcje (czas, aplikacje, dokładanie pracy, dane, ile zapłacę)
7. 06 Start — jutro + gwarancja + CTA

Triada żyje raz w hero (słowo) i raz w artefakcie (obraz).

### `/wdrozenie`

H1 → lead → ścieżka pieniędzy → 3 kroki → **formularz** → stack → 2 900 zł → FAQ.

Przy przycisku: gwarancja, zdanie o danych, „po zgłoszeniu dostaniesz maila”. Textarea opcjonalna. Bez linku „załóż konto” pod primary CTA. Drabina: pierwsza piątka 0 zł za opinię po 30 dniach; kolejne osoby 390 zł.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian kształtu. Teksty maili i komunikatów zgłoszenia (`FoundingService`, `EmailService`) mówią „raport”, nie „przegląd”.

## UI

`apps/web/components/landing/*`, `apps/web/app/wdrozenie/*`, metadata (`layout.tsx`, `page.tsx`, `opengraph-image.tsx`), `llms.txt`, `/pakiet-retencji`. Skill `odejmowanie` i `ux-writing` dostają locked copy.

## Fazy implementacji

- [x] Faza 1 — spec + copy landingu, `/wdrozenie`, formularz, metadata, maile, skille

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Długi H1 pęka na 360 px | Dwie linie, bez `nowrap` na całym wierszu |
| „Raport” vs stary język w GTM | Skills + lekcja; research zostaje historyczny |
| Dwa ciemne pasy po zamianie 01↔02 | 01 (artefakt) ciemny, 02 (telefon) jasny |

## Changelog

- 2026-08-19 — utworzono spec i wdrożono copy.
- 2026-08-19 — H1 na ofertę: „Raport ze wszystkich podopiecznych. Za 0 zł, w 24 godziny.” Zakaz „kończy”.
- 2026-08-19 — H1 `/` z mocka: „Wszyscy podopieczni w jednym raporcie.” Sub: „Za 0 zł, w 24 godziny.” Spec: `2026-08-19-landing-mockup.md`.
