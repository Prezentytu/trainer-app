# Hormozi: oferta, pieniądze, GTM

## TLDR

Constraint to oferta i dystrybucja, nie craft UI. Grand Slam Offer Fazy A: **„14 dni do pełnego wglądu”** (10 miejsc, call 30 min, gwarancja warunkowa). Q1–Q4 zamknięte: progi 0/39/99/199, Stripe na founding, warm outreach 100 dni, brand **RepMaxer**. W produkcie tylko mianownik równania wartości: aha = ukończona sesja, protokół ciszy, Peak-End 3 fakty, founding + referral.

## Problem

Landing sprzedaje mechanizm („Wysyłasz link”), nie wynik biznesowy trenera. Cennik 0/5 → 39/15 jest porównywalny z CoachGuru. Brak gwarancji, stosu bonusów, lead magnetu i silnika leadów. Continuity 39 zł/mies. nie finansuje pozyskania (CFA niemożliwe). Onboarding liczy „link wysłany”, nie zalogowany trening. Radar bez gotowca wiadomości to statystyka.

## Proponowane rozwiązanie

Kolejność: oferta → model pieniądza → jeden kanał Core Four → kod, który skraca czas i wysiłek do pierwszej ukończonej sesji klienta.

### Grand Slam Offer (Faza A)

**Nazwa MAGIC:** „14 dni do pełnego wglądu”.

**Avatar:** solo trener personalny PL, 8–25 podopiecznych, dziś Excel + WhatsApp.

**Wynik:** w 14 dni aktywni klienci trenują z planu w telefonie; trener widzi, kto nie trenował, i pisze pierwszy.

**Stack (10 miejsc / miesiąc):**

- Call 30–45 min: import 1 planu + 3 klientów + linki wysłane na callu.
- Early access 90 dni (white-glove) albo Founding 490 zł (3 miesiące Solo + cena locked).
- Szablon planu siłowego + szablony metod.
- Protokół ciszy: 3 gotowce (nigdy nie trenował / dzień 7 / dzień 14).
- Kanał founderski 90 dni.
- Eksport JSON/CSV.

**Gwarancja warunkowa:** jeśli w 14 dni od calla żaden podopieczny nie dokończy treningu — 0 zł albo zwrot founding. Warunek: link wysłany do ≥3 osób na callu.

**Czego nie ma:** kalendarz, BLIK, dieta, native app, AI „układa za Ciebie”.

### Decyzje Q1–Q4 (zamknięte)

| # | Decyzja |
|---|---|
| Q1 | **Progi:** Start 0 zł / 5, Solo 39 zł / 15, Pro 99 zł / 30, Studio 199 zł / 50. Nie per-klient. |
| Q2 | **Stripe** na founding (Checkout, 490 zł raz). Autopay/BLIK gdy >20 płatnych self-serve. |
| Q3 | **Warm outreach** jako jedyny kanał 100 dni. Nie ads. Playbook: `.ai/gtm/`. |
| Q4 | **RepMaxer** na zewnątrz. Workout Alchemist nie używać w outreachu. |

Wieczny unlimited free w FAQ = zamknięty. Early access = 90 dni albo founding, potem próg.

### Model pieniądza

- Faza I: 10× white-glove 0 zł / 90 dni (give). Od 11. osoby Founding 490 zł.
- Faza II (po PMF): upsell Pro 99 zł przy progu 15; DFY migracja później.
- Faza III: continuity progowa jak Q1. Anulowanie 1 klikiem gdy wejdzie subskrypcja.

## Model danych

Bez nowych encji. Activation liczona z istniejących `WorkoutSession` / `Trainer.CreatedAt`. Founding = Checkout Stripe + e-mail do founderskiego inboxu (bez tabeli do Fazy B, gdy będzie webhook).

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| GET | `/api/dashboard` | — | + `activation`: `hasCompletedSession`, `firstCompletedSessionOn`, `clientsWithActivePlan`, `clientsWithSessionLast14Days`, `trainerCreatedAt` |
| POST | `/api/clients/{id}/send-reminder` | `{ message }` | bez zmian — `message` = treść protokołu |
| GET | `/api/portal/{token}/progress-report` | — | `facts` max 3, bez „Brak ukończonych”; fakt `session` gdy ostatni trening jest dziś |
| POST | `/api/founding/apply` | `{ name, email, phone?, track: "whiteglove" \| "founding" }` | `{ ok, checkoutUrl?, message }` — publiczny, rate limit |

Typy w `apps/web/lib/api.ts` lustrzane.

## UI

- Landing: wynik przed mechanizmem; CTA „Umów 30 min wdrożenia” → `/wdrozenie`; secondary sign-up. FAQ bez unlimited free.
- `/wdrozenie` — oferta + formularz white-glove / founding.
- `/checklista` — lead magnet (1-pager).
- Panel: onboarding krok 3 = ukończona sesja; kolejka „Napisz” otwiera dialog z gotowcem; referral po pierwszej sesji.
- Portal: Peak-End — 3 fakty; bez PR pierwszy fakt jest dominantą.
- First-run kreator: tylko preset 4×3 gdy trener nie ma jeszcze planu.

## Fazy implementacji

- [x] Faza 0 — ten spec + zamknięcie Q1–Q4 w specu launchu + playbook GTM
- [x] Faza 1 — activation + onboarding aha + first-run 4×3
- [x] Faza 2 — protokół ciszy (3 gotowce, 1-klik)
- [x] Faza 3 — Peak-End 3 fakty
- [x] Faza 4 — lead magnet, `/wdrozenie`, FAQ, referral, founding apply (+ Stripe gdy klucz)

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Stripe bez klucza na early access | Checkout no-op; zgłoszenie idzie e-mailem; UI nie obiecuje natychmiastowej płatności |
| Gwarancja spalona >20% | Onboarding na callu; kill signal Fazy A |
| 490 zł za wysoko na PL | Alternatywa 190 zł setup w copy founding; white-glove zostaje 0 zł |
| Feature factory wraca | Anty-scope: Grupa 3, nutrition, ads, native |

## Relacja

Źródło strategii: [`2026-08-12-research-rynkowy-i-strategia-launchu.md`](2026-08-12-research-rynkowy-i-strategia-launchu.md). Playbook: `.ai/gtm/`.

## Changelog

- 2026-08-12 — utworzono spec: Grand Slam Offer, Q1–Q4, kontrakt activation/founding, fazy P0.
- 2026-08-12 — wdrożono P0: aha = sesja, protokół ciszy, Peak-End 3 fakty, `/checklista`, `/wdrozenie`, founding apply, FAQ bez unlimited.
