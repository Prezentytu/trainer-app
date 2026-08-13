# Hormozi: ujawniona preferencja, haki, skuszenie trenerów

## TLDR

Desk research 2026 (PL + EN): trenerzy **mówią** all-in-one + dieta + AI, **płacą** za plan na telefonie, czas i retencję. Sufit PL = 39 zł / 15 osób (CoachGuru). Stos haków: diagnoza (`/checklista`, `/ile-tracisz`) → próbka (`/gotowce`, szablon 4×3) → one-off (rozmowa 30 min, 0 zł / 5 osób). Q1–Q4 z [`2026-08-12-hormozi-oferta-i-gtm.md`](2026-08-12-hormozi-oferta-i-gtm.md) **bez zmian**. Nie budować diety, kalendarza, native apki, AI-generatora jako pitchu.

## Problem

Poprzedni research ([`2026-08-12-research-rynkowy-i-strategia-launchu.md`](2026-08-12-research-rynkowy-i-strategia-launchu.md)) dobrze nazwał bolączki, ale mieszał **deklaracje** (fora, landingi konkurencji) z **kartą**. Lead magnet to jedna checklista — PDF „do przeczytania później” ginie. Brak money math w skrypcie outreachu. Walidacja miała być na internecie, nie na 10 rozmowach.

## Proponowane rozwiązanie

Słuchać ujawnionej preferencji. Dawać trzy typy haków Hormoziego (diagnoza / próbka / one-off), give:ask 3:1, warm outreach. Kod tylko tam, gdzie hak wymaga strony. Gate i cennik bez zmian.

### Ujawniona preferencja (karta, nie ankieta)

| Już kupują | Kotwica | Co naprawdę kupują |
|---|---|---|
| CoachGuru | 0 zł / 5, **39 zł / 15**, 119 zł / 30, 249 zł / 50 | Plan na telefonie, filmy, przypomnienia, „wyglądam PRO”. Klient 0 zł. |
| Fitebo | ~10 €+, trial 14 dni bez karty, progi 5/15/30… | Baza ćwiczeń + apka w sklepie z logo (status). Mniej pytań „jak wykonać”. |
| TrueCoach | ~$20 / 5 → $107 / 50 + 5% od płatności | Prostota programowania. Sufit: skok 50→51. |
| Trainerize | baza tania, TCO ~$125/mies. z add-onami | Hybryda studio. Po ABC: billing, anulowanie, support. |
| Excel + WhatsApp | 0 zł | Kontrola, zero lock-in. Przegrywają przy ~10–20 osobach. |

**Sufit PL na soft coachingowy: 39 zł przy 15 osobach.** Mediana zarobków PT PL ~8 300 zł brutto (ARF / wynagrodzenia.pl, 2026, kierunkowe). 39 zł ≈ ¼ sesji (140–160 zł). Jeden zatrzymany pakiet 8×150 zł = **1 200 zł / mies.** — soft spłaca się przy jednym uratowanym kliencie.

Nie kupują (deklaracja ≠ karta): AI „układa za Ciebie”, dieta jako add-on $45, white-label setki $/mies., karząca gamifikacja.

### Bolączki, za które zapłacą (kolejność pieniędzy)

1. Churn, którego nie widzą — odejście w tyg. 8–16; sygnał 3–4 tyg. wcześniej. 20 dni bez logu ≈ +68% ryzyka (Gymkee; kierunkowe).
2. Czas na przepisywanie planów (Reddit #1 na narzędzia).
3. WhatsApp jako CRM — „co dziś robię?”, ginące info.
4. Klient nie zainstaluje apki — tarcie logowania. Klin: link bez konta.
5. Ukryte koszty i lock-in (Trainerize Trustpilot).
6. Status — Fitebo sprzedaje ikonę w sklepie; my **10 sekund do planu**.

Higiena PL: polski UI, klient 0 zł, 5 osób za 0 zł na zawsze, progi nie per-osoba, anulowanie bez polowania, dane do wyjęcia.

### Równanie wartości (copy, nie nowy cennik)

- Wynik: wiesz, kto nie trenował, zanim zrezygnuje — i masz co mu napisać.
- Pewność: rozmowa 30 min, 1 plan + 3 linki; trening w 14 dni albo 0 zł (warunek: 3 linki na rozmowie).
- Czas: aha = ukończona sesja klienta.
- Wysiłek: klient bez sklepu i bez konta.

Pitch (język trenera — kwota, osoby, czas):

> Gdy jeden klient odchodzi, to ~1 200 zł miesięcznie. 39 zł za 15 osób. Na rozmowie przenosisz plan do linku — klient otwiera w przeglądarce, bez konta. Jeśli w 14 dni nikt nie dokończy treningu — 0 zł.

### Stos haków

| Typ | Hak | 5 min | Odsłania | Gdzie |
|---|---|---|---|---|
| 1 Diagnoza | Checklista 15 osób | Kogo napisać dziś | Lista w panelu | `/checklista` |
| 1 Diagnoza | Ile tracisz, gdy klient odchodzi | `N × stawka × 8 = zł` | 39 zł vs strata | `/ile-tracisz` |
| 2 Próbka | 3 gotowce WhatsApp | Wkleja dziś, bez konta | Przycisk Napisz | `/gotowce` |
| 2 Próbka | Szablon 4×3 | Plan na jutro | Kreator + link | `.ai/gtm/szablon-4x3.md` |
| 3 One-off | Rozmowa 30 min | Plan w linku | 90 dni / 490 zł rok | `/wdrozenie` |
| 3 One-off | 0 zł / 5 osób | Produkt, nie trial | Próg 15 osób | cennik — reklamować jako hak |

Give:ask 3:1. Nie: ebook, webinar, „50 szablonów”, ads.

### Źródła (kierunkowe)

Trustpilot / CostBench Trainerize; TrainerVerdict 2026; Reddit r/personaltraining (agregat 1FIT); CoachGuru i Fitebo landingi + cenniki; Gymkee / FitEcho / Trainero (churn); ARF / wynagrodzenia.pl (zarobki PT PL 2026). Walidacja = 10 rozmów, nie kolejny PDF.

## Model danych

Bez zmian. Strony haków są statyczne (kalkulator tylko na froncie).

## Kontrakt API

Brak. `/ile-tracisz` i `/gotowce` nie wołają API.

## UI

Landing light (`LandingThemeLock`), tokeny mono v2, copy skill `ux-writing`.

| Ścieżka | Rola |
|---|---|
| `/ile-tracisz` | Jedyny hak na homepage (embed). Dwa pola; wynik = N × stawka × 8. Kontrast: 39 zł / 15. CTA → `/wdrozenie`. |
| `/gotowce` | Tylko DM (follow-up). Nie w nav/stopce landingu. |
| `/checklista` | Tylko DM (pierwsza wiadomość). Nie w nav/stopce landingu. |
| Stopka | Regulamin · Prywatność · Kontakt · Zaloguj się. |

NAV panelu trenera **bez** tych stron (to marketing).

## Fazy implementacji

- [x] Faza 0 — ten spec + GTM (haki, skrypt, walidacja 10 rozmów, szablon 4×3)
- [x] Faza 1 — `/ile-tracisz` + `/gotowce` + stopka + copy checklisty
- [ ] Faza 2 — 10 rozmów: czym płacą dziś; gate ≥5 sesji klienta / 14 dni (wykonanie założyciela, nie kod)

## Ryzyka i wpływ

| Ryzyko | Groźba | Mitygacja |
|---|---|---|
| Hak przyciąga trenerów, którzy chcą dietę/kalendarz zanim wyślą link | Zły avatar, zmarnowane rozmowy | Pytanie 1 na rozmowie: czym płacą dziś. Jeśli 8/10 chce dietę — zmień hak, nie roadmapę. |
| Copy „odpad” wstydzi | Odrzut | Mówić: odchodzi / skończył współpracę. Strona `/ile-tracisz`. |
| Liczby branżowe (68%, 1 200 zł) nie trzymają się PL | Pitch traci wiarygodność | Na rozmowie używać **ich** stawki z kalkulatora. |
| Kolejna fala ficzerów zamiast dystrybucji | Constraint złamany | Ten spec nie każe kodować diety, kalendarza, native apki, AI-generatora. |

## Changelog

- 2026-08-12 — utworzono spec; strony `/ile-tracisz` i `/gotowce`; GTM: stos haków, money math, walidacja 10 rozmów. Copy: nigdy „odpad” w UI.
- 2026-08-13 — homepage = 1 hak (kalkulator). Checklista i gotowce zostają URL-ami do outreachu, bez chrome landingu.
