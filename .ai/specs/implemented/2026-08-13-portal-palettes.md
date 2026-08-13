# Palety stylistyczne portalu klienta

## TLDR

Druga oś wyglądu obok jasny/ciemny: klient wybiera paletę (Grafit, Mech, Piasek, Ocean, Pink Pony) w profilu portalu. Palety to chromatyczne nadpisania powierzchni i krawędzi — od razu rozpoznawalne, nie 2% hue-shift. Akcenty danych (PR / gain / loss) bez zmian. Zapis w `localStorage`, bez backendu.

## Problem

Portal ma tylko przełącznik jasny/ciemny na mono v2. Klienci chcą kilku nastrojów kolorystycznych bez rozjechania design systemu i bez hue w chrome (przyciski, nav).

## Proponowane rozwiązanie

Ortogonalna oś: `<html data-theme="light"|brak>` × `<html data-palette="forest|calm|sea|pony"|brak>`.

- Brak `data-palette` = Mono (dotychczasowy wygląd, zero migracji).
- Paleta nadpisuje `--bg`, `--surface*`, `--field`, `--line*`, `--scrim` oraz lekko `--fg-muted` (dark i light). `--pr`/`--gain`/`--loss`/`--danger` zostają. Pink Pony w light ma cukierkowy invert (przycisk).
- Komponenty nie znają palet — idą tokenami.
- Picker tylko w profilu portalu. Landing zdejmuje paletę (`lockLightTheme` → Mono), żeby marketing został mono.
- Per-urządzenie: klucz `repmaxer-palette` obok `repmaxer-theme`.

## Model danych

Brak zmian schematu i encji `Client`.

| Klucz | Wartości | Default |
|---|---|---|
| `repmaxer-palette` | `mono` (lub brak) / `forest` / `calm` / `sea` / `pony` | Mono |

## Kontrakt API

Brak. Preferencja nie synchronizuje się między urządzeniami.

## UI

Profil portalu, sekcja „Aplikacja”: siatka 5 swatchy — Grafit, Mech, Piasek, Ocean, Pink Pony.

## Fazy implementacji

- [x] Faza 1 — spec + tokeny palet w `globals.css`
- [x] Faza 2 — `theme.ts` (Palette, boot, theme-color) + picker w profilu
- [x] Faza 3 — landing lock zdejmuje paletę; walidacja

## Ryzyka i wpływ

| Ryzyko | Mitigacja |
|---|---|
| Kontrast AA na zabarwionym tle | Tinta powierzchnie, tekst zostaje z mono; hairline w podobnej jasności co oryginał |
| Landing z hue | `lockLightTheme` czyści `data-palette` |
| FOUC palety | ten sam boot script co motyw |
| Trener i klient na jednym urządzeniu | paleta globalna na `<html>` — akceptowalne; picker tylko w portalu |

## Changelog

- 2026-08-13 — utworzono spec i wdrożono palety portalu.
- 2026-08-13 — palety z realną chromatycznością (nie near-black tint). Nazwy: Grafit, Mech, Piasek, Ocean, Pink Pony. Pony = cukierkowy róż (tło, karty, krawędzie; light invert różowy).
