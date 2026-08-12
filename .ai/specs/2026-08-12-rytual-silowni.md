# Rytuał siłowni — Peak-End, Dziś, jeden check-in

## TLDR

Po „Zakończ” klient widzi najpierw 1–3 fakty progresu (i PR gdy prawdziwe), nie formularz. Ekran Dziś odpowiada w 5 s: nazwa dnia → lista rund → invert CTA. Daily check-in zostaje na Dziś; post-session nie dubluje snu. Live sesja ma „Wstrzymaj” (draft zostaje).

## Problem

1. **Peak-End odwrócony** — `lightCheckin` w `SessionLogger` pokazuje 3 skale + notatkę zanim `SessionSummaryView`. `celebrationFacts` żyją w gałęzi, której portal nie renderuje. `SessionSummaryView` nie bierze `facts`. Na Dziś jeden muted `tip`; na Progres facts w ogóle nie wchodzą.
2. **Dwa modele wellness** — `CheckInCard` (mood/sen) na Dziś plus post-session (feeling/sleep/energy).
3. **Dziś nie przechodzi testu 5 s** — „Cześć” zamiast nazwy dnia; sticky CTA pod długą listą; PWA i intake konkurują z treningiem.
4. **Live bez wyjścia** — tylko back przeglądarki albo „Zakończ”.

## Proponowane rozwiązanie

### Peak-End

- Portal po complete: od razu `SessionSummaryView` z `facts.slice(0, 3)` + PR.
- Post-session: jedna skala „Samopoczucie” + opcjonalna wiadomość + skip (nie blokuje summary). Sen/energia zostają na daily Dziś.
- Progres: te same 3 fakty na górze zakładki (typografia, bez nowej karty-ściany).
- Dziś: `tip` znika — fakty nie konkurują z listą ćwiczeń.

### Dziś

- H1 = etykieta dnia albo „Trening w toku”, nie „Cześć, {imię}”.
- Meta: `N rund/ćwiczeń · ~X min` (rundy z `previewRowsFromItems`).
- CTA invert w pierwszym viewport (nad listą). Ten sam przycisk dokuje na dole **tylko** gdy in-flow wyjedzie z kadru — nigdy dwa invert naraz.
- PWA i intake: disclosure pod foldem (jak check-in).

### Live

- „Wstrzymaj” w headerze sesji → `router.push` na Dziś; draft/autosave bez zmian. Bottom nav nadal ukryty.

## Model danych

Bez zmian encji / migracji. Istniejące: `ProgressReport.facts`, `SessionCheckinInput.feelingScore`, `ClientCheckIn` (daily).

## Kontrakt API

Bez nowych endpointów. Używamy:

| Metoda | Ścieżka | Użycie |
|---|---|---|
| GET | `/api/portal/{token}/progress-report` | facts w summary + Progres |
| PUT | `/api/portal/{token}/sessions/{id}` | complete + opcjonalny feeling |
| POST | `/api/portal/{token}/check-ins` | daily na Dziś (bez zmian) |

Typ `ProgressReport` w `apps/web/lib/api.ts` bez zmian. `SessionSummaryView` dostaje opcjonalne `facts`.

## UI

- [`SessionLogger.tsx`](apps/web/components/SessionLogger.tsx) — usunąć `lightCheckin` jako osobny ekran przed summary; feeling + skip w `SessionSummaryView` albo po nim.
- [`SessionSummaryView.tsx`](apps/web/components/SessionSummaryView.tsx) — 3 fakty, jedna skala, skip.
- [`portal/[token]/page.tsx`](apps/web/app/portal/[token]/page.tsx) — hero, rundy, CTA above fold, PWA/intake disclosure.
- [`portal/[token]/progress/page.tsx`](apps/web/app/portal/[token]/progress/page.tsx) — facts na górze.
- [`portal/[token]/session/[sessionId]/page.tsx`](apps/web/app/portal/[token]/session/[sessionId]/page.tsx) — przekazać facts.

Tokeny mono v2, prymitywy `ui.tsx`, polski copy bez wykrzykników.

## Fazy implementacji

- [x] Faza 1 — Peak-End: facts w summary, check-in po nagrodzie / skip
- [x] Faza 2 — Dziś hero + CTA + disclosure; Wstrzymaj w sesji
- [x] Faza 3 — Progres: 3 fakty na górze; walidacja web

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Mniej danych wellness po sesji | Daily check-in na Dziś zostaje; feeling opcjonalny |
| CTA nad listą + sticky = dwie dominanty | Sticky tylko poza kadrem; ten sam label |
| Wstrzymaj vs Zakończ | Copy: „Wstrzymaj” = wróć, sesja in_progress; „Zakończ” = complete |

## Changelog

- 2026-08-12 — utworzono spec (Peak-End przed formularzem, Dziś 5 s, jeden model wellness, Wstrzymaj).
- 2026-08-12 — wdrożono: facts w SessionSummaryView, feeling po nagrodzie, hero Dziś bez small talku, CTA above fold, Wstrzymaj, PWA/intake disclosure, fakty na Progres.
- 2026-08-12 — jeden invert CTA (sticky tylko poza viewport); portal tab bar pełna szerokość zamiast floating pill.
