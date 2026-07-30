# Roadmapa: auth trenera + funkcje biznesowe (PL)

## TLDR

Spec-roadmapa **bez implementacji** — instrukcje researchu i kolejność prac dla przyszłego agenta. Grupa 2: auth + wdrożenie publiczne. Grupa 3: kalendarz, pakiety, płatności (domena WodGuru / Trainero).

> Nie kodować z tego pliku, dopóki osobny plan nie wybierze zakresu i nie odpowie na Open Questions.

## Open Questions (bramka przed implementacją)

- Q1: Auth trenera — pojedynczy trener (shared password / 1 konto) czy od razu multi-tenant (wielu trenerów)?
- Q2: Hosting — VPS + SQLite wystarczy na MVP produkcji, czy od razu Postgres (Fly.io / Railway)?
- Q3: Pakiety i płatności — czy wchodzą w MVP biznesowe, czy najpierw tylko kalendarz rezerwacji bez cash?
- Q4: Integracja SMS (SMSAPI / Twilio) — budżet i zgody RODO (marketing vs transakcyjne)?

## Problem

Obecna apka:

- API bez auth (CORS tylko localhost) — nie da się bezpiecznie wystawić publicznie.
- Brak kalendarza / pakietów / płatności — na rynku PL (WodGuru: 5 zł/klient, cap 499 zł) to główne narzędzie studiów PT; my jesteśmy „programming + logging”, oni „operations”.
- Token portalu bez rate limit — brute-force capability URL.

## Grupa 2 — Auth + wdrożenie

### Zakres docelowy

1. Login trenera (cookie session lub JWT HttpOnly).
2. Middleware chroniący `/api/*` poza `/api/portal/{token}/*`.
3. CORS z env (`ALLOWED_ORIGINS`).
4. Rate limit na resolve tokenu portalu (np. 30/min/IP).
5. Deploy: API + web + trwała baza.

### Instrukcje researchu dla agenta

1. **Auth stack .NET 10 Minimal API**
   - Porównaj: ASP.NET Core Identity (cookie) vs własny `TrainerUser` + PBKDF2/BCrypt + signed cookie.
   - Dla 1 trenera: env `TRAINER_PASSWORD_HASH` + login form może wystarczyć (zero Identity).
   - Multi-tenant później: tabela `Trainer` + `Client.TrainerId` — zaplanuj kolumnę już teraz jeśli Q1 = multi.
   - Źródła: docs.microsoft.com (Identity Minimal APIs), OWASP Session Management.

2. **Hosting i baza**
   - SQLite na VPS (Hetzner CX22 / Contabo) — proste, ale backup i concurrent writes.
   - Postgres na Fly.io / Railway / Neon — lepsze na multi-user.
   - Koszt miesięczny PL vs EUR; backup cron; HTTPS (Caddy / Cloudflare).
   - Zmienna `ConnectionStrings__Default` + migracje EF (wyjście z samego `EnsureCreated`).

3. **Rate limiting**
   - `Microsoft.AspNetCore.RateLimiting` na `/api/portal/{token}` i login.
   - Log failed token lookups (bez logowania samego tokenu w plain).

4. **PWA / CORS**
   - `ALLOWED_ORIGINS=https://app.example.com`
   - Cookie `SameSite=None; Secure` jeśli API i web na różnych domenach — albo reverse proxy same-origin.

### Fazy (gdy Q1–Q2 rozstrzygnięte)

- [ ] Faza A — login 1 trenera + ochrona API + CORS env
- [ ] Faza B — rate limit portalu + rotacja demo tokenu poza seedem lokalnym
- [ ] Faza C — deploy + backup + healthcheck
- [ ] Faza D (opcjonalnie) — multi-tenant + migracje EF

## Grupa 3 — Funkcje biznesowe PL

### Konkurencja (kontekst)

| Gracz | Siła | Słabość vs my |
|---|---|---|
| WodGuru | Rezerwacje, pakiety, BLIK, SMS | Słabe programowanie treningów |
| Trainero / Everfit | All-in-one coaching | Cena, UX EN-first |
| eFitness | Enterprise, KSeF | Za ciężkie dla solo PT |

Nasza nisza: **najlepszy kreator planów + Gravitus-owy logger klienta**; biznesowe funkcje dokładamy tam, gdzie trener traci czas (grafik, pakiety, cash).

### Zakres docelowy

1. **Kalendarz** — sloty trenera, rezerwacja klienta (portal), no-show rules.
2. **Pakiety sesji** — typ (10/20), odliczanie, wygaśnięcie.
3. **Płatności** — BLIK/Autopay lub Stripe; link do zakupu pakietu.
4. **Przypomnienia** — email (MVP) → SMS (później).
5. **Fakturowanie** — Fakturownia / KSeF (research przed kodem).

### Instrukcje researchu dla agenta

1. **Płatności PL 2026**
   - Autopay (BLIK) vs Stripe vs Przelewy24 — prowizje, KYC, webhooki, refundy.
   - Czy WodGuru-podobny model „płatność przez platformę” jest OK prawnie (agent rozliczeniowy)?
   - Dokumentacja: autopay.pl, stripe.com/docs, przelewy24.pl.

2. **KSeF / faktury**
   - Obowiązek KSeF dla kogo i od kiedy (stan na datę researchu).
   - Fakturownia API vs własne faktury PDF.
   - Czy MVP może wystawić tylko „potwierdzenie płatności” bez KSeF?

3. **SMS**
   - SMSAPI.pl vs Twilio — cena/SMS PL, szablony, zgody RODO.
   - Najpierw email (Resend / SMTP) jako tańszy zamiennik przypomnień.

4. **Model cenowy produktu**
   - Benchmark: WodGuru 5 zł/klient, cap 499 zł; Trainero ~30 USD.
   - Propozycja: freemium do N klientów (programowanie + portal), płatne pakiety/rezerwacje.

5. **UX**
   - Kalendarz mobile-first w portalu klienta (jak WodGuru booking).
   - Na karcie klienta trenera: „sesje w pakiecie: 6/10”, CTA „Przypomnij o przedłużeniu”.

### Fazy (gdy Q3–Q4 rozstrzygnięte)

- [ ] Faza E — model `Package` + `Booking` + UI kalendarza (bez płatności)
- [ ] Faza F — płatność online + webhook + odliczanie pakietu
- [ ] Faza G — przypomnienia email; SMS opcjonalnie
- [ ] Faza H — faktury / KSeF (jeśli wymagane)

## Poza zakresem tej roadmapy

- Service worker / pełny offline shell PWA (osobny spike).
- Wearables (Apple Watch) — post-MVP.
- Dieta / nawyki — nie kopiować Everfit bez potrzeby.

## Changelog

- 2026-07-30 — utworzono roadmapę z instrukcjami researchu (auth + biznes PL); bez implementacji.
