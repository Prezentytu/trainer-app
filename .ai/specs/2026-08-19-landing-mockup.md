# Landing z mocka RepMaxer Landing

## TLDR

Landing `/` jak mock `RepMaxer Design System/RepMaxer Landing.dc.html`: editorial hero (jedna linia H1 + muted sub), belka 3 faktów, 01 artefakt, 02 panel trenera + kroki + telefon (autoplay, bez scrub), ciemne 01/03/05, jasny 06. Copy z mocka. Brand = Instrument Sans + tokeny mono v2.

## Problem

Landing po specu D i copy sprzedażowym ma teaser w hero, dwulinijkowy H1 oferty, belkę 2 faktów, scroll-scrub 190 svh w 02 i dłuższe leady. Nowy mock ma inny rytm: pełnoekranowy hero bez teasera, trzy liczby w belce, panel trenera jako drugi artefakt, telefon w pętli autoplay.

## Proponowane rozwiązanie

- Mock = układ i copy. Brand = Instrument Sans 700 (nie Archivo 800), tokeny, mobile-first.
- CTA → `/wdrozenie`. Nav „Zaloguj się” → `/sign-in`. Ghost cennika → `/sign-up`.
- Nav „Raport” → `#raport`.
- Krok 02: „kto zamilkł” → „kto nie odezwał się od dwóch tygodni”.
- `/wdrozenie` i `wdrozenieOffer.ts` bez zmian.
- Supersede rytmu D tam, gdzie mock go zmienia (hero, belka, 02, skala H2 na `/`).

### Copy (locked z mocka)

| Miejsce | Tekst |
|---|---|
| Eyebrow | Dla trenerów personalnych |
| H1 | Wszyscy podopieczni w jednym raporcie. |
| Sub | Za 0 zł, w 24 godziny. |
| Lead hero | Wysyłasz arkusz albo zrzuty z WhatsAppa. Wraca gotowa lista i trzy wiadomości do wysłania. |
| Belka | 24 h / Czas na raport · 5 / Miejsc w miesiącu · 0 zł / Cena dla podopiecznego |
| CTA | Zamów darmowy raport |

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/*`, metadata (`page.tsx`, `layout.tsx`, `opengraph-image.tsx`, `LandingJsonLd`), `llms.txt`. Panel 02: `TrainerPanelMock` — dekoracyjny, `lg:` i wyżej.

## Fazy implementacji

- [x] Faza 1 — spec + skills
- [x] Faza 2 — hero, 01–06, panel, telefon autoplay
- [x] Faza 3 — metadata + lint / typecheck / build + QA 360/768/1280

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| H1 17 ch pęka na 360 px | clamp, bez nowrap na całym wierszu |
| Panel 208+px rozpycha mobile | `hidden` do md; md lista + overflow-x; lg pełny chrome |
| Archivo wraca z mocka | Instrument Sans; trzeci font = nie |
| Scrub 02 zostaje i gryzie się z panelem | kasacja 190 svh / pin |
| „zamilkł” z mocka | zamiana na locked triadę |

## Changelog

- 2026-08-19 — utworzono spec (copy z mocka, brand Instrument Sans).
- 2026-08-19 — wdrożono: hero bez teasera, belka 3, panel w 02, autoplay telefonu, copy z mocka.
- 2026-08-19 — rytm RWD: `SECTION_SPACE` jako `py`, `SECTION_STACK`, panel od md, CTA 01 w ciemnym pasie.
