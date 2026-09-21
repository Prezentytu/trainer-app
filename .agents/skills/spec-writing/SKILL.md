---
name: spec-writing
description: Write a high-quality, skeleton-first specification for a Trainer App feature before coding. Use when starting a new feature, planning an architecture change, or when asked to "write a spec", "napisz spec", "zaprojektuj funkcję", "plan feature".
---

# Spec writing (skeleton-first)

Projektuj funkcje przed kodowaniem, zgodnie z `.ai/specs/AGENTS.md`. Cel: jasne, spójne, odtwarzalne decyzje.

## Workflow

1. **Kontekst** — przeczytaj root `AGENTS.md` i wskazane w Task Router przewodniki dla obszaru funkcji.
2. **Utwórz plik** — `.ai/specs/{YYYY-MM-DD}-{tytuł-kebab}.md` na bazie `.ai/specs/TEMPLATE.md`.
3. **Szkielet** — napisz najpierw tylko TLDR + blok **Open Questions** (jeśli są krytyczne niewiadome blokujące model danych/architekturę/zakres). Jedno pytanie na linię, najlepiej zamknięte.
   - **STOP**: zatrzymaj się i poczekaj na odpowiedzi użytkownika. Nie rozpisuj reszty, dopóki nie znasz odpowiedzi. To twarda bramka.
4. **Rozwinięcie** — po odpowiedziach uzupełnij: Problem, Rozwiązanie, Model danych, Kontrakt API, UI, Fazy, Ryzyka. Usuń blok Open Questions.
5. **Fazy** — rozbij implementację na fazy; każda kończy się działającą aplikacją i przechodzi bramkę walidacyjną.
6. **Review** — sprawdź spójność: nazwy, lustrzane typy TS/DTO, prefiks `/api`, brak surowego `fetch`, teksty po polsku.

## Soczewka recenzenta

- Czy spec nie marnuje miejsca na opis zwykłego CRUD? Skup się na tym, co unikalne.
- Czy model danych respektuje uwagę o `EnsureCreated` (zmiana schematu = reset `trainer.db`)?
- Czy odpowiedź API i typ w `apps/web/lib/api.ts` są zgodne?
- Czy ryzyka mają konkretne scenariusze porażki i mitygacje?

## Po wdrożeniu

Dopisz wpis do sekcji Changelog specu i (gdy w pełni gotowe) przenieś plik do `.ai/specs/implemented/` przez `git mv`.
