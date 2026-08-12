# Tworzenie planu z profilu klienta (zamknięta pętla)

## TLDR

Z widoku klienta (sekcja „Przypisz plan”) trener może stworzyć nowy plan bez utraty kontekstu: kafelek → `/plans/new?clientId=N` → kreator → zapis automatycznie przypisuje plan i wraca na profil klienta z toastem.

## Problem

Na profilu klienta jedyna ścieżka to przypisanie istniejącego planu. Gdy brakuje pasującego planu, trener musi opuścić profil, zbudować plan w bibliotece, wrócić i przypisać ręcznie (~8 interakcji, otwarta pętla Zeigarnik).

## Proponowane rozwiązanie

1. Kafelek „Stwórz nowy plan” w siatce wyboru planu (i w empty state) z `?clientId=`.
2. Wizard `/plans/new` czyta `clientId`, pokazuje pill „Plan dla: {imię}”, domyślną nazwę, wymusza plan klienta (bez szablonu).
3. `PlanBuilder` + `usePlanPersistence`: po `plans.create` wywołanie `assignments.create`, potem `router.push(/clients/{id}?assigned=1)`.
4. Profil klienta po `?assigned=1` pokazuje toast i czyści query.

Bez zmian backendu — istniejące endpointy wystarczą.

## Model danych

Brak zmian schematu / encji.

## Kontrakt API

| Metoda | Ścieżka | Request | Response |
|---|---|---|---|
| POST | `/api/plans` | `PlanInput` | `{ id }` |
| POST | `/api/assignments` | `{ planId, clientId, startDate, note }` | — |
| GET | `/api/clients/{id}` | — | `ClientDetails` (imię w wizardzie) |

## UI

- `apps/web/app/(app)/clients/[id]/page.tsx` — kafelek + toast
- `apps/web/app/(app)/plans/new/page.tsx` — kontekst klienta (Suspense + `useSearchParams`)
- `apps/web/components/plan-builder/PlanBuilder.tsx` — prop `assignTo`
- `apps/web/components/plan-builder/usePlanPersistence.ts` — auto-przypisanie

## Fazy implementacji

- [x] Faza 1 — spec
- [x] Faza 2 — profil klienta (kafelek, empty state, toast)
- [x] Faza 3 — wizard + PlanBuilder + persistence
- [x] Faza 4 — walidacja (`./scripts/check.sh`)

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Przypisanie pada po utworzeniu planu | Fallback na `/plans/{id}` — plan nie ginie |
| `useSearchParams` bez Suspense | Owinięcie w `<Suspense>` jak na `/sign-in` |
| Konkurencja CTA na profilu | Kafelek ghost/dashed; primary nadal „Przypisz plan” |

## Changelog

- 2026-08-12 — utworzono spec.
- 2026-08-12 — wdrożono zamkniętą pętlę: kafelek → wizard z clientId → auto-przypisanie → toast.
