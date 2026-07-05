# Specyfikacje — zasady

Podejście spec-first: przed nietrywialną zmianą opisujemy projekt w `.ai/specs/`. Dzięki temu decyzje są jawne, spójne i możliwe do odtworzenia przez ludzi i agentów.

## Kiedy pisać spec

- Nowy zasób/dział (np. „historia treningów”, „logowanie”).
- Zmiana modelu danych lub kontraktu API dotykająca wielu plików.
- Zmiana architektury lub przepływu (workflow).

## Kiedy pominąć

- Poprawki błędów, literówki, izolowany refaktor jednego pliku bez zmiany zachowania.

## Konwencja nazw

- `{YYYY-MM-DD}-{tytuł-kebab-case}.md`, np. `2026-07-05-training-history.md`.
- Nowe specy trafiają do `.ai/specs/`. Po pełnym wdrożeniu przenieś do `.ai/specs/implemented/` (użyj `git mv`, by zachować historię).

## Cykl życia

1. **Szkielet** — najpierw TLDR + blok „Open Questions” (jeśli są niewiadome). **Zatrzymaj się i poczekaj na odpowiedzi** zanim rozpiszesz resztę.
2. **Rozwinięcie** — po odpowiedziach uzupełnij spec z `TEMPLATE.md` i usuń blok Open Questions.
3. **Implementacja** — koduj fazami; każda faza zostawia działającą aplikację.
4. **Changelog** — po wdrożeniu dopisz datę i zwięzłe podsumowanie w sekcji Changelog specu.

## Zawartość (checklist)

Każdy nietrywialny spec zawiera: TLDR, Problem, Rozwiązanie, Model danych, Kontrakt API, Fazy implementacji, Ryzyka, Changelog. Szablon: `.ai/specs/TEMPLATE.md`.

## Never

- Nie zostawiaj w specu nieaktualnych endpointów/encji/założeń.
- Nie wprowadzaj prefiksów typu `SPEC-*` — trzymaj się `{data}-{tytuł}.md`.
