# Landing: narracja PAS + scena telefonu z torem

## TLDR

Kalkulator straty idzie przed cennik (PAS: panel → strata → cena jako ulga), numeracja 03/04 się zamienia. Scena telefonu dostaje realny tor sticky (~190svh, scrub 0–85% toru, treść wyśrodkowana w kadrze) zamiast zerowego toru i martwego dołu. Latarka: symetryczne kolumny `max-content` + `justify-between`, przeplot ~20 wpisów, ghost 30%, reveal `fg-muted`, drift przy scrollu, RAF tylko gdy hero w kadrze. Pary sekcji wracają na `TIGHT` (02, 04).

## Problem

Ramka `lg:h-[calc(100svh-72px)]` z `items-start` zostawiała pusty dół kadru, a sticky miał zerowy tor (wysokość sekcji = ramka + padding) — przypinał się i odpinał w tym samym punkcie, a scrub kończył się dokładnie przy przypięciu. Na dużych ekranach użytkownik widział tylko stan „gotowe” i ~1,5 ekranu pustki między 01 a 02. Poniżej 1024 px pętla `setInterval` resetowała serie do 0/4 w kadrze. Latarka: kolumny `1fr` flush-left dawały pustkę przy prawej krawędzi (asymetria), ghost 20% fg na białym był prawie niewidoczny, ta sama fraza powtarzała się 13× w kolumnie. Cennik stał przed kalkulatorem straty — kotwica ~6 000 zł nie pracowała na rzecz „0 zł”.

## Proponowane rozwiązanie

- Kolejność: Hero → 01 Produkt → 02 Panel → 03 Ile tracisz → 04 Cennik → 05 Pytania → 06 Start. Rozdziały: historia (01+02), pieniądze (03+04), domknięcie (05+06). 02 i 04 = `SECTION_SHELL_TIGHT`, reszta `SECTION_SHELL`.
- Scena 01: sekcja `lg:min-h-[190svh]`; sticky dziecko `h-[calc(100svh-72px)]` z `items-center` (bez `-mt`, bez `z-10`/`bg`). Progress = (pin − rect.top) / (0.85 × tor); tor = wysokość sekcji − kadr − padding-top (liczony z realnych wymiarów, nie ze stałej). Scroll w górę cofa serie (scroll position = state).
- <1024 px: IntersectionObserver na mocku telefonu — sekwencja gra raz (~900 ms/seria) od ~60% widoczności, stan końcowy zostaje; reset dopiero po pełnym wyjściu z kadru.
- Latarka: szyny L/P `max-content` (1+1 do 2199 px, 2+2 od 2200 px); pula ~20 wpisów + deterministyczny przeplot (bez `Math.random`, SSR-safe); `.landing-log-ghost` 46% fg; reveal `text-fg-muted`; dziura maski liczona z bloku H1; `--drift` (translate3d) na treści w RAF; RAF startuje/stopuje z widocznością hero.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

`components/landing/{LandingPage,PhoneMock,LogWall,LossCalculatorSection,PricingSection,TrainerPreview}.tsx`, `globals.css` (`.landing-log-*`, nowy `.landing-log-drift`). Copy i anchory (`#cennik`, `#ile-tracisz`) bez zmian. Skille: `design-system`, `senior-ux-cro` (PAS, kotwiczenie, loss aversion), `responsive-ui`, `apple-design`.

## Fazy implementacji

- [x] Faza 1 — narracja: kolejność sekcji, numeracja 03/04, rytm TIGHT/SPACE
- [x] Faza 2 — scena telefonu: tor 190svh, scrub 0–85%, mobile play-once
- [x] Faza 3 — latarka: symetria, przeplot, kontrast, drift, RAF gating
- [x] Faza 4 — QA 360–1920 + reduced-motion + lint/typecheck/build

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Tor 190svh za długi/krótki na nietypowych viewportach | Progress liczony z realnej wysokości sekcji (`rect.height − kadr − padding`), nie ze stałej |
| Centrowanie kadru ścina H2 na niskich oknach | Kadr = flex `items-center` bez overlapu; telefon ograniczony `min(72svh, 640px, 100svh−8rem)` |
| Kolumny `max-content` szersze niż ekran na md | 2 kolumny od `md`, 4 od `lg`; `overflow-hidden` na warstwie |
| Drift rozjeżdża wiązkę z pointerem | Drift tylko na treści (wewnętrzny wrapper); maski beam/elipsy zostają na warstwach zewnętrznych |

## Changelog

- 2026-08-14 — utworzono spec.
- 2026-08-14 — fazy 1–3 zaimplementowane (kolejność sekcji, scena z torem, latarka).
- 2026-08-14 — przyczyna źródłowa „jeszcze większej przerwy”: `overflow-x-hidden` na wrapperze `MarketingShell` robił z niego scroll container (computed `overflow-y: auto`) i zabijał **każdy** `position: sticky` na landingu — nav odklejał się przy scrollu, a scena telefonu nigdy się nie przypinała, więc tor 190svh stawał się czystą pustką. Fix: klasa usunięta; oś X domyka `body { overflow-x: hidden }` w `globals.css` (propaguje się na viewport, nie tworzy scroll containera).
- 2026-08-14 — QA w przeglądarce (3444/1280/768/360 px): pin + scrub 0/4→4/4+PR odwracalny, autoplay <1024 px gra raz i trzyma stan (ticki dokładnie co 900 ms), reduced-motion pokazuje statyczne 4/4, brak poziomego overflow na 360 px. Bramka: lint + typecheck + build (z `SKIP_ENV_VALIDATION=true` jak w `check.sh`) zielone.
- 2026-08-14 — latarka nie maluje po closerze: fade dołu = overlay (nie druga maska); closer `bg-background`. Gutter ★ na obu warstwach.
- 2026-08-14 — RWD latarki: szyny przy krawędziach zamiast 4×`1fr` (ucinało wpisy / znikało na 14"). Dziura = `w-fit` H1+lead+CTA. Druga kolumna od 2200 px. Ghost 46%. Jedna elipsa — WebKit `source-in` zerował warstwę.
