# Redesign formularza ćwiczenia

## TLDR

Jeden wspólny `ExerciseFormDialog` (tryby `quick` / `full`) zamiast dwóch rozjechanych formularzy. Partia i sprzęt z pigułek (slugi), wklejanie linku YouTube z podglądem, zwinięte szczegóły (wzorzec, mięśnie, instrukcje). Naprawione: błąd za scrimem, podwójny POST, zmiażdżona textarea, rozjazd fasetek sprzętu.

## Problem

Formularz w bibliotece pokazywał ścianę pól, ukrywał błędy zapisu za overlayem, nie blokował podwójnego kliknięcia i zapisywał sprzęt jako wolny tekst zamiast slugów. Kreator miał osobny, minimalny dialog — każdy fix trzeba było robić dwa razy. Z UI nie dało się ustawić wzorca ruchu ani mięśni.

## Proponowane rozwiązanie

1. `ExerciseFormDialog` — `variant: "quick" | "full"`, API jak dawny `NewExerciseDialog`.
2. `parseYoutubeId` — pełny URL lub samo ID → miniatura.
3. Sprzęt / partia / wzorzec — pigułki, zapis slugów; nieznane wartości z edycji zachowane.
4. `Dialog.busy` — loading + disabled na potwierdzeniu.
5. `textareaClass` — bez `h-10`.
6. Błąd zapisu w dialogu (`ErrorBanner`).

## Model danych / API

Bez zmian. `ExerciseInput` już przyjmuje wszystkie pola.

## UI

- [apps/web/components/ExerciseFormDialog.tsx](../../apps/web/components/ExerciseFormDialog.tsx)
- Biblioteka: `variant="full"`; kreator: `variant="quick"`
- Usunięto `NewExerciseDialog.tsx`

## Fazy implementacji

- [x] Helperzy (`parseYoutubeId`, `exerciseInputFromExercise`) + prymitywy
- [x] `ExerciseFormDialog`
- [x] Wiring biblioteka + kreator
- [x] Spec, lekcja, walidacja

## Changelog

- 2026-08-04 — utworzono i wdrożono wspólny formularz ćwiczenia.
