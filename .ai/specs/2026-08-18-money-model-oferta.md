# Money model RepMaxer — oferta Hormozi

Supersedes część oferty w [`2026-08-12-hormozi-oferta-i-gtm.md`](2026-08-12-hormozi-oferta-i-gtm.md) i prepaid 390-jako-rok w [`2026-08-14-wdrozenie-oferta-i-mail.md`](2026-08-14-wdrozenie-oferta-i-mail.md). Craft landingu: [`2026-08-18-landing-d-editorial.md`](2026-08-18-landing-d-editorial.md) — H1 i komunikat wdrożenia zmieniają się tu; cennik 0 / 39 / 99 zostaje.

## TLDR

Wejście to płatne **wdrożenie 390 zł** (14 dni, gwarancja mierzona ukończonym treningiem), nie 90 dni za 0 zł. Po sukcesie 390 zł wraca jako kredyt rozłożony na 12 miesięcy planu rocznego. Landing ciągnie cztery dźwignie value equation above the fold i układa sekcje jak slippery slide. Darmowe konto 5 osób zostaje jako downsell.

## Problem

Dwa darmowe wejścia (konto 0 zł i wdrożenie 90 dni / 0 zł) dają 30-dniowy gross profit ≈ 0. Test CFA Hormoziego (30D GP > 2× CAC) nie przechodzi. Gwarancja bez ceny nie ma dźwigni. H1 „Wysyłasz link. Widzisz trening.” ciągnie tylko wysiłek, nie wynik.

## Proponowane rozwiązanie

### Sekwencja (Stage I teraz)

| Etap | Oferta | Cena | Co dostaje |
|---|---|---|---|
| Attraction | Wdrożenie 14 dni | **390 zł** raz | Plan w linku, 3 linki na rozmowie, 90 dni planu 30 osób, Pakiet retencji |
| Kotwica | Wdrożenie osobiste | **2 900 zł** | Cała baza przeniesiona, 90 dni opieki, ten sam pakiet |
| Upsell (rozmowa) | Migracja DFY | +300–500 zł | Pozostali klienci i plany — ręcznie, import AI/CSV |
| Continuity | Rollover | 390 zł = **32 zł / mies.** rabatu przez 12 mies. | Na planie 39 zł / 15 albo 99 zł / 30 |
| Downsell | Konto | **0 zł** / 5 osób | Bez wdrożenia, bez pakietu |

**Gwarancja (wariant A, start):** jeśli w 14 dni od płatności żaden podopieczny nie ukończy treningu — zwrot 390 zł (Stripe Refund). Warunek liczy `WorkoutSession.Status == completed`.

**Wariant B (test, nie w UI):** kaucja Win-Your-Money-Back — wdrożenie 0 zł przy spełnieniu warunków; kaucja wraca tylko jako kredyt na rok. Startujemy od A, B w kolejnym kwartale.

Cena startowa 390 zł. Podnosić co kwartał, aż zysk przestanie rosnąć (kolejne szczeble: 490 → 790 → 990).

### Landing `/` — value equation + slippery slide

Struktura Hormoziego mówi, **co robi sekcja**. Skill `odejmowanie` mówi, **ile tekstu**. Nie dodajemy katalogu funkcji.

1. Hero — H1 mechanizm (Wysyłasz / Widzisz), lead, 2 CTA, belka 0 zł / 5 osób
2. 01 Produkt (ciemny)
3. 02 Panel (jasny)
4. 03 Ile tracisz (ciemny)
5. 04 Cennik 0 / 39 / 99 + jedno zdanie o wdrożeniu
6. 05 Pytania
7. 06 Start — permission CTA, caps: 10 miejsc · 390 zł · gwarancja 14 dni

Płatny stack tylko na `/wdrozenie`. Wyceny weryfikowalne cennikiem: 90 dni planu 30 osób = 297 zł, pakiet retencji = 190 zł. Zakaz wyceniania rozmowy.

### `/wdrozenie` — high-ticket

Promise, dla kogo / nie dla kogo, problem + `/ile-tracisz`, dlaczego to działa, stack z wycenami, gwarancja, scarcity z powodem, kotwica 2 900 zł, formularz (primary = zapłać 390 zł).

### Pakiet retencji

Nazwany zestaw istniejących assetów: `/gotowce`, `/checklista`, szablony metod w kreatorze. Strona `/pakiet-retencji`. Wartość w copy: **190 zł**.

### Pętla dowodu

Bez zmyślonych opinii. Po 3 wdrożeniach: imię + ilu klientów + ile treningów w 14 dni — slot między ofertą a cennikiem. Format zarezerwowany, sekcja pusta do czasu case'ów.

### Metryki (bez kodu)

- **CAC** per kanał = (ads + narzędzia + prowizje + czas foundera × stawka) / nowi płacący. Stawka robocza: 150 zł/h.
- **30D Cash** = 390 zł (albo 2 900) − koszt dostawy (30 min + maile).
- Cel: 30D GP > 2× CAC (CFA Level 3).
- Kill signal Stage I: >20% gwarancji spalonych albo 30D GP < CAC przez pełny kwartał.

## Model danych

Na `Trainer` (migracja Postgres + reset lokalnego `trainer.db`):

| Pole | Typ | Rola |
|---|---|---|
| `WdrozeniePaidAt` | `DateTime?` | start okna 14 dni |
| `WdrozeniePaymentIntentId` | `string?` | refund Stripe |
| `WdrozenieCreditGrosze` | `int` | 39000 po płatności; 0 po zwrocie albo po zużyciu rolloveru |

`PlanKey = founding` po opłaconym wdrożeniu = 30 osób, 0 zł/mies. przez 90 dni. Nazwa w UI: „Wdrożenie — 30 osób”.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/founding/apply` | `{ name, email, phone?, preferredSlot?, track: "whiteglove" \| "founding" \| "personal" }` | `{ ok, checkoutUrl?, message, emailSent }` — `founding` = 390, `personal` = 2900, `whiteglove` = sam zapis bez płatności |
| GET | `/api/me` | — | + `wdrozeniePaidAt`, `wdrozenieCreditGrosze`, `wdrozenieGuaranteeEligible` |
| POST | `/api/billing/checkout` | `{ planKey }` | gdy credit > 0: kupon Stripe `amount_off = credit/12`, 12 miesięcy |
| POST | `/api/billing/wdrozenie-gwarancja` | — | zwrot Stripe; credit = 0; plan → free jeśli brak subskrypcji |

Typy w `apps/web/lib/api.ts` lustrzane. Nazwy `founding` zostają w kodzie.

Stripe Checkout `mode=payment`: produkt „RepMaxer — wdrożenie 14 dni” (390 zł) albo „RepMaxer — wdrożenie osobiste” (2 900 zł). Metadata `track`.

## UI

- `/` — `Hero`, `PhoneMock`, `TrainerPreview`, `LossCalculatorSection`, `PricingSection`, `Faq`, `FinalCta`
- `/wdrozenie` — szablon high-ticket, primary CTA „Zapłać 390 zł”
- `/pakiet-retencji` — trzy assety z wartościami
- Ustawienia: kredyt rollover + przycisk gwarancji, gdy eligible
- Zakaz UI: founding, white-glove, Solo, Pro, call, unlimited

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — landing + `/wdrozenie` + pakiet
- [x] Faza 3 — billing (checkout, webhook, gwarancja, rollover) + testy
- [x] Faza 4 — regulamin, skills, lekcje, bramka

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Nikt nie płaci 390 bez case'ów | Gwarancja z zębami; downsell 0 zł / 5; start 390, nie 990 |
| Gwarancja >20% | 3 linki na rozmowie; kill signal kwartału |
| Schema Trainer | Migracja EF + usunięcie lokalnego `trainer.db` |
| Stripe bez klucza | Checkout no-op; mail; UI nie obiecuje natychmiastowej płatności |
| Hick 0 vs 390 | Primary = 390; konto 5 osób niżej, nie jako równa karta |
| Dwa ciemne pasy pod rząd | 01 i 03 i 05 ciemne; produkt/panel jasne |

## Changelog

- 2026-08-18 — utworzono spec: sekwencja, wariant A/B, landing, kontrakt, metryki.
- 2026-08-18 — wdrożono Stage I: landing slippery slide, `/wdrozenie` 390 zł, pakiet retencji, Stripe wdrożenie + gwarancja + rollover.
- 2026-08-18 — korekta: H1 z powrotem mechanizm; oferta ze stackiem tylko na `/wdrozenie`; limit wdrożenia 30 osób; stack bez wyceny rozmowy (487 zł).
- 2026-08-18 — Stage I bez reklam: CFA (30D GP > 2× CAC) nie obowiązuje, bo CAC = czas foundera, a hak jest za 0 zł. Rachunek na pokrycie pozyskania wraca, gdy `WDROZENIE_PRICE_ZL > 0` i ruszą płatne kanały. Aktualna oferta: [`2026-08-18-oferta-przeglad-tygodnia.md`](2026-08-18-oferta-przeglad-tygodnia.md).
