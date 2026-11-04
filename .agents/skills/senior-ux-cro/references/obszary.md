# Senior UX/CRO — obszary szczegółowe

Wyjęte z `SKILL.md` bez zmian treści. Czytaj tylko sekcję obszaru, którego dotyka zmiana.

## Aktywacja i pierwsze użycie (wzorce Linear / Notion)

Cel: jak najszybciej doprowadzić do **pierwszej wartości** (pierwszy klient / plan / zalogowana sesja), nie do feature touru.

- **Template-first**: zamiast pustego canvasu daj szablon planu albo przykładowe dane do edycji — user zaczyna od zmiany, nie od tworzenia z zera.
- **Empty state jako nauczyciel**: nie „Brak planów" — pokaż jak wygląda stan docelowy + 1 CTA (`EmptyState`). Empty state = onboarding.
- **Wartość przed wysiłkiem**: podgląd / sample zanim wymagasz pełnej konfiguracji (Reciprocity).
- **Naucz 1 kluczowej interakcji**: ta, która koreluje z retencją (np. „przypisz plan klientowi", „zaloguj pierwszą serię") — nie checklista-tour („dodaj zdjęcie").
- **Micro-celebracja pierwszego sukcesu**: krótki, spokojny feedback po pierwszym planie/sesji (tone of voice z `design-system` — bez infantylizacji).
- **Zaufanie przez odejmowanie** (benchmark Styrka): brak konta dla klienta, brak zbędnych pól, obietnice negatywne w copy („bez X") sygnalizują szacunek dla czasu. Minimalizm to sygnał zaufania, nie pustka — dotyczy portalu **i** panelu trenera (test odejmowania w `design-system`). Spec: `.ai/specs/2026-08-05-styrka-minimalizm-analiza.md`.

---

## Formularze (Baymard)

- **Liczba pól > liczba kroków**: 5 kroków po mniej pól bije 2 kroki po wielu. Priorytet: redukcja pól i perceived effort.
- **Single-column** na mobile (bazowe `grid`; kolumny dopiero od `sm:` — patrz `responsive-ui`).
- **Walidacja inline na blur** — nie dopiero po submitcie całego formularza.
- **Dane nigdy nie giną po błędzie**; scroll do pierwszego błędu.
- **Autofill / `inputMode`**: poprawne atrybuty HTML (tel, email, decimal dla kg).
- **„Po co to pole"** przy wrażliwych lub nietypowych danych — jedno zdanie obok etykiety.
- **Przycisk nazywa rezultat**: „Utwórz plan", „Dodaj klienta" — nie „Zapisz" / „OK" / „Wyślij".

---

## Perceived performance

**Płynność = feature produktu**, nie polish na końcu. Styrka shipowała osobne release'y tylko o scrollowaniu, kontraście i responsywności inputów. Te same progi obowiązują **logger klienta i panel trenera** (nawigacja, kreator, listy, dashboard).

Progi (Doherty Threshold i praktyka product craft):

| Czas | Zachowanie UI |
|---|---|
| **< 100 ms** | brak wskaźnika — spinner/skeleton pogarsza odczucie |
| **~100–300 ms** | natychmiastowy feedback stanu (disabled, „Zapisuję…") bez skeletonu |
| **> 300 ms** | skeleton 1:1 z finalnym layoutem (`apps/web/components/skeletons.tsx`) — zero jank / layout-shift |
| **< 400 ms** | cel feedbacku interakcji (Doherty) — powyżej spada poczucie flow |

- **Optimistic UI** tylko dla akcji odwracalnych (toggle, usunięcie z undo, reorder) + rollback przy błędzie + `useUndoToast`.
- **Nigdy** optimistic dla destrukcyjnych / nieodwracalnych (trwałe usunięcie bez undo, billing).
- Logowanie sesji: efekt < 100 ms, sync w tle (`fitness-ui-ux`).
- Prefetch / natychmiastowy feedback nawigacji w panelu — unikaj pustego ekranu między trasami.

---

## Dashboard i statystyki

Dla `TrainerDashboard`, karty klienta, trendów — odwrócona piramida:

1. **Status (góra)**: 3–5 KPI — `StatBlock` + delta lub sparkline. Zasada **5 sekund**: sens ekranu bez czytania instrukcji.
2. **Kontekst (środek)**: 1–3 wykresy / heatmapy (trend, compliance).
3. **Szczegół (dół)**: tabela / lista do enumeracji + drill-down.

Zasady:

- **Liczba + trend zawsze razem** — sama liczba bez kierunku jest ślepa.
- **Enumeracja = tabela/lista**, nie ściana kafelków (lista klientów do „przelecenia" ≠ dashboard KPI).
- **Uczciwe wykresy**: oś od zera gdzie porównujesz wielkości; etykiety bezpośrednie zamiast legendy wymuszającej skakanie wzrokiem; zero chartjunk.
- Value > Label: liczby `font-mono tabular-nums` mocniejsze niż etykiety (`text-muted`).

---

## Procedury techniczne

### Hierarchia i skanowanie

- **Value > Label**: kluczowe liczby (serie×powtórzenia, ciężar, %1RM, PR) mocniejsze niż etykiety — waga/kontrast (`text-foreground` `font-semibold`) vs `text-muted`.
- **F-pattern**: kontrolki (checkbox/radio/uchwyt, akcje) po lewej; najważniejsze u góry-lewej.
- **Recognition over recall**: avatary klientów (`Avatar`) zamiast surowych ID; ikona/kontekst ćwiczenia zamiast samej nazwy.
- **Hierarchia wagą i kolorem, nie rozmiarem** (max 3 wagi fontu — `design-system`).

### Polerowanie (dark mode craft)

- **Elewacja luminancją**: głębia przez jaśniejszą powierzchnię (`background` → `surface` → `surface-hover` / `surface-active`), nie przez cień. Na ciemnym tle cienie są prawie niewidoczne — tinted shadow tylko jako wsparcie (miękki, niski opacity, dopasowany do tła).
- **Ramki sparingly**: separacja różnicą tła; `border-border` głównie dla inputów i unoszących się warstw (Dialog, dropdown).
- **Micro-interactions ≤ 150–200 ms**: `transition` powiązany z fizyką; zero layout-shift na hover. Każdy klikalny element: `:hover` + `:focus-visible`.
- **Konkretne dane**: „221 sesji", „4.9" zamiast okrągłych „500" — tylko realne dane.
- **Visual swatches**: kluczowe wybory (typ dnia, wariant progresji) jako karty/segmented (`SegmentedControl`), nie ukryte w `<select>`.
- **Reasuring micro-interactions**: tooltip na hover/focus w punkcie wahania (opis presetu, skutek akcji).

### Tryb logowania sesji (mobile)

- CTA w dolnej 1/3 (thumb zone); dodanie serii ≤ 2 tapnięcia; < 10 tapnięć na ćwiczenie.
- Cele ≥ 44×44px; bottom nav: 3–5 zakładek, active = min. 2 zmiany wizualne, safe area.
- Prefill → 1 tap zaloguj → auto rest timer → jasne „następne ćwiczenie".
- Peak-End: po sesji krótkie podsumowanie + PR gdy zasłużone.
