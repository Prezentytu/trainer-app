# Analiza konkurencji i priorytety (Fala 1–3)

## TLDR

Arc / Setify / Gravitus / **Styrka** to trackery B2C (benchmark oczekiwań podopiecznego — Styrka dodatkowo jako kurs minimalizmu i craftu logowania). Realni konkurenci PL: CoachGuru, TreningLab, Fitebo, Trainero. Nasza przewaga: AI import planów, portal bez konta, programowanie siłowe (RIR/tempo/%1RM), trener w pętli. Fala 1 domyka obietnice landingu (push, objętość mięśniowa, wykresy, detektor zastoju) bez zmian schematu bazy. Backlog minimalizmu (fale A–D): `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`.

## Problem

Landing obiecuje analitykę i „zauważ zastój jako pierwszy", a produkt ma tylko sparkline'y. Push jest zarejestrowany, ale backend nic nie wysyła. Flat 149 zł odcina trenerów z 5–15 klientami, którzy u CoachGuru płacą 0–39 zł. Rynek PL wycenia per podopieczny i oczekuje czatu, przypomnień i brandingu trenera.

## Proponowane rozwiązanie

**Pozycjonowanie:** nie lepszy tracker — trener reaguje pierwszy (plan → log → progres → retencja).

**Cena (rekomendacja, poza Fala 1):** progi per aktywny podopieczny z darmowym wejściem (np. 0 zł / 5, potem ~5–8 zł/os. lub pakiety 15/30/50). Komunikat: „płacisz tylko Ty, podopieczni bezpłatnie". Zmiana copy Pricing/FAQ — osobne zadanie po decyzji.

**Fala 1 (ten spec — implementacja):** push, objętość per grupa mięśniowa, wykresy czasowe, detektor zastoju. Zero migracji schematu. Jedyna nowa zależność: NuGet `WebPush`.

**Fala 2 (backlog):** publiczne SEO stron ćwiczeń + kalkulatory, udostępnialna karta progresu z brandingiem trenera, zdjęcia postępu, kalendarz z datami planowanych dni.

**Fala 3 (backlog):** czat trener↔klient, billing SaaS, opcjonalne konto klienta (upgrade z tokenu), standardy siły, instrumentacja zagregowanych wyników.

## Model danych

Bez zmian encji. Agregacje z `LoggedSet`, `Exercise.PrimaryMuscles`, `WorkoutSession`, `ClientPushSubscription`. Konfiguracja push: `Push:PublicKey`, `Push:PrivateKey`, `Push:Subject`. Cron: `Cron:Key` + nagłówek `X-Cron-Key`.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/cron/reminders` | header `X-Cron-Key` | `{ sent, skipped }` |
| GET | `/api/clients/{id}/muscle-volume?weeks=4` | — | `{ weeks, groups: [{ muscle, sets, volumeKg }] }` |
| GET | `/api/portal/{token}/muscle-volume?weeks=4` | — | j.w. |
| GET | `/api/plans/{id}/muscle-volume` | — | objętość zaplanowana (sets per muscle) |
| GET | `/api/clients/{id}/trends?weeks=12` | — | `{ weeks: [{ weekStart, sessions, volumeKg, workingSets }] }` |
| GET | `/api/portal/{token}/trends?weeks=12` | — | j.w. |
| GET | `/api/clients/{id}/stagnation` | — | `{ items: [{ exerciseId, exerciseName, reason, sessionsWithoutProgress, volumeDropWeeks }] }` |

Push triggery (bez nowych endpointów użytkownika): komentarz trenera, `send-reminder`, cron dzienny.

Typy i metody w `apps/web/lib/api.ts` lustrzane.

## UI

- `MuscleVolumeBars` — zakładka Wyniki `/clients/[id]`, portal `/portal/[token]/progress`
- `LineChart` (SVG) — trendy + e1RM w tych samych miejscach
- Detektor zastoju — karta w profilu klienta + `AttentionItem` reason `stagnation` na dashboardzie
- `sw.js` — `push` + `notificationclick` z URL portalu

## Fazy implementacji

- [x] Faza 0 — ten spec
- [x] Faza 1 — PushService + triggery + cron workflow + sw.js
- [x] Faza 2 — muscle-volume (API + UI)
- [x] Faza 3 — trends + LineChart
- [x] Faza 4 — Stagnation + ChurnRadar
- [x] Faza 5 — testy, typecheck, check.sh, changelog

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| WebPush bez kluczy VAPID w env | Graceful no-op gdy brak konfiguracji |
| Cron podwójne wysyłki | Idempotencja: brak sesji dziś + jedno uruchomienie/dzień |
| PrimaryMuscles JSON — grupowanie poza SQL | Materializacja + agregacja w pamięci |
| IDOR na nowych GET | `TrainerAccess` + testy izolacji |
| Flat 149 zł vs rynek | Rekomendacja w tym specu; copy nie zmieniamy w Fali 1 |

## Changelog

- 2026-08-03 — utworzono spec (analiza + backlog fal + kontrakt Fali 1).
- 2026-08-03 — wdrożono Falę 1: NuGet `WebPush`, `PushService` (komentarz trenera, send-reminder, `POST /api/cron/reminders` + workflow), `Analytics` (muscle-volume / trends), `Stagnation` + reguła w `ChurnRadar`, UI `MuscleVolumeBars` + `LineChart` (profil klienta, portal Progres), testy `AnalyticsAndPushTests` + izolacja tenanta.
- 2026-08-05 — dodano Styrkę do benchmarków B2C (minimalizm); backlog craft/retencji/audytu panelu przeniesiony do `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md` (bez przepisywania Fal 2–3 tego specu).
- 2026-08-12 — GTM, cennik freemium i research v2 (m.in. kryzys zaufania Trainerize, generation vs consolidation): [`.ai/specs/2026-08-12-research-rynkowy-i-strategia-launchu.md`](2026-08-12-research-rynkowy-i-strategia-launchu.md). Rekomendacja flat 149 zł w tym specu **superseded** przez progi 0/39/99/199 (do decyzji Q1).
