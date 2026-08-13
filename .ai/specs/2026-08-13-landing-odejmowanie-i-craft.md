# Landing: odejmowanie + craft

## TLDR

Homepage: hero (H1 + LiveFeed), telefon w splicie, gigantyczne 0 zł + 39/99, kalkulator straty, FAQ ×5, CTA. Jedyny hak na `/` to kalkulator (embed `/ile-tracisz`). Checklista i gotowce zostają jako URL-e do DM. Light mono v2. `MarketingShell` wspólny.

## Problem

Landing czyta się jak równomierny dokument: trzy rozdziały produktu opowiadają to samo, feed z maską wygląda na ucięty, gigantyczne `0` chowa próg ICP (39 zł / 15), stopka to mapa 8 linków CAPS, a `/gotowce` i checklista duplikują chrome. Konkurencja (CoachGuru, TrueCoach, Hevy) sprzedaje katalog funkcji — my mamy wąskie pozycjonowanie, ale craft rozmywa dominantę.

## Proponowane rozwiązanie

Jedna job, ale z gestami: feed w ruchu, ogromne 0, telefon w splicie, *ich* strata w zł. Nav: hairline po scrollu. Footer: marka + prawo + login. Checklista/gotowce nie na homepage (słaby intent).

Świadomie nie: dark landing, blur, gradienty, social proof, ProgressCard, ToolsStrip, porównanie vs CoachGuru.

## Model danych

Bez zmian.

## Kontrakt API

Bez zmian.

## UI

| Plik | Rola |
|---|---|
| `components/landing/MarketingShell.tsx` | `data-theme="light"`, ThemeLock, nav, footer |
| `LandingNav.tsx` | sticky; hairline przy `scrollY > 8`; Produkt · Cennik + CTA |
| `Hero.tsx` | H1 (stagger) + LiveFeed 4 wiersze, bez maski |
| `LiveFeed.tsx` | Rotacja 2,8 s; `sm:grid-cols-3` równe tory, ćwiczenie `text-left`; pause on hover; reduced-motion = statycznie |
| `PhoneMock.tsx` | `id="produkt"`; split copy \| 380px; auto-check |
| `PricingSection.tsx` | `id="cennik"`; gigantyczne 0 + 39/99 + CTA |
| `LossCalculatorSection.tsx` | Embed `IleTraciszCalculator` — suwaki stacked, interpolowana kwota |
| `Faq.tsx` | 5 pytań |
| `LandingFooter.tsx` | wordmark; Regulamin · Prywatność · Kontakt · Zaloguj |
| Usunięte z `/` | PanelMock, ProgressCard, checklista/gotowce w chrome |
| Strony haków | `MarketingShell` zamiast duplikowanego headera |

Copy osi (H1, CTA wdrożenia, secondary konto) bez zmian. Skille: `design-system`, `senior-ux-cro`, `ux-writing`, `apple-design`, `responsive-ui`.

## Fazy implementacji

- [x] Faza 1 — spec + shell (nav hairline, footer, MarketingShell na 4 stronach)
- [x] Faza 2 — homepage: Hero+panel, Phone, Pricing, FAQ; usunięcie feed/progres/list
- [x] Faza 3 — rytm, stagger tylko H1, bramka web

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Karta panelu + H1 nie mieszczą się w 100svh na telefonie | Mobile: naturalny stack; `min-h` tylko od `lg` |
| Layout shift nav (border) | Zawsze `border-b`; kolor transparent → `--line` |
| `wdrozenie` jest `"use client"` | Formularz do osobnego pliku; strona = serwer + shell |
| Słabe social proof wraca | Zero logo/opinii do 3 prawdziwych imion ICP |

## Changelog

- 2026-08-13 — utworzono spec (IA 5 bloków, cięcia, shell).
- 2026-08-13 — korekta: LiveFeed + gigantyczne 0 + split telefonu + kalkulator na `/`; checklista/gotowce tylko DM.
- 2026-08-13 — feed: 3 równe kolumny, ćwiczenie `text-left`; kalkulator: suwaki + interpolowana kwota.
