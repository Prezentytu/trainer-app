---
name: senior-ux-cro
description: Senior UX/UI + psychologia konwersji (CRO) dla Trainer App — redukcja kosztu interakcji, biasy poznawcze, aktywacja, formularze, perceived performance i etyczna perswazja. Użyj przy KAŻDEJ implementacji lub redesignie UI (strony, komponenty, formularze, kreator planów, logowanie sesji, statystyki, empty states, nawigacja, dashboard). EN triggers — conversion optimization, UX psychology, interaction cost, activation, empty state, form UX, peak-end, perceived performance, ethical persuasion, CTA microcopy. Czytaj razem z `design-system`, `fitness-ui-ux`, `responsive-ui` i `ux-writing`.
---

# Senior UX/UI & Conversion (CRO) — Trainer App

Warstwa "10/10": senior nie tylko projektuje wygląd — **zarządza uwagą i minimalizuje koszt interakcji** (poznawczy, fizyczny, czasowy). Interfejs ma prowadzić użytkownika i usuwać wątpliwości na każdym kroku.

Stosuj ŁĄCZNIE z:

- `design-system` — tokeny semantyczne (`bg-surface`, `text-foreground`, `text-muted`, `accent`), typografia, spacing, radius. Zero surowych `zinc-*`/`yellow-*`.
- `fitness-ui-ux` — domena (kreator = gęstość; logowanie sesji = wielka typografia, minimum tapnięć).
- `responsive-ui` — mobile-first, nic ucięte, nic poza kontenerem.
- `apple-design` — response/press feedback, materiały (`.session-chrome`), spójność przestrzenna, typografia optyczna, craft — bez nowej biblioteki motion.
- `ux-writing` — głos i microcopy; jasność przed zwięzłością; CTA = czasownik + obiekt, nie slogan.

Kontekst: dark-only (RepMaxer), UI po polsku, portal trenera (B2B) + portal klienta. Brak konsumenckiego premium — hooki subskrypcyjne tylko przy realnym billingu.

---

## Workflow: Plan-Validate-Execute

1. **Friction Audit** — policz koszt interakcji: ile kliknięć/tapnięć i decyzji do celu. Gdzie user się waha?
2. **Cognitive Mapping** — zmapuj UI na grupy poniżej (Decyzja / Motywacja / Percepcja).
3. **Visual Refinement** — label-value, elewacja luminancją, F-pattern, hover/focus, perceived performance.
4. **Final Validation** — przejdź "Senior Excellence Checklist" PRZED oddaniem.

Każda zmiana ma obniżyć koszt interakcji LUB wykorzystać bias, nie pogarszając spójności z design systemem ani etyki.

---

## Psychologia — 3 grupy

### Decyzja (mniej wysiłku, mniej wahania)

- **Smart Defaults**: nigdy pusty formularz. Kreator planów — presety serii (6-4-2-5-3-1, rampa+back-off); nowa seria dziedziczy ciężar/powtórzenia z poprzedniej. Default bezpieczny i odwracalny — nigdy destrukcyjny.
- **Hick's Law**: więcej opcji = wolniejsza decyzja. Ogranicz wybory widoczne naraz; zaawansowane za progressive disclosure. Segmented/karty zamiast długiego `<select>`.
- **Tesler's Law**: złożoność się przenosi, nie znika — system ma ją wchłonąć (presety, klonowanie tygodnia, sensowne defaulty), nie użytkownik.
- **Anchoring / Contrast (Von Restorff)**: 1 wizualna dominanta na widok — główny CTA `bg-accent` na monochromatycznym tle; reszta ghost/secondary. Nie pokazuj opcji/kosztu w izolacji.
- **Loss Aversion**: ramka straty (~2× silniejsza): „Ryzykujesz utratę niezapisanych zmian w planie". Preferuj **undo** (`useUndoToast`) zamiast modala potwierdzenia przy odwracalnych usunięciach.

### Motywacja (momentum i przywiązanie)

- **Goal Gradient**: progress/onboarding/kreator nie startuje od 0% — pokaż częściowe wypełnienie („Szablon wybrany · +20%"). Bliżej celu = mocniejsza motywacja.
- **Zeigarnik**: niedokończone zadanie ciągnie uwagę — checklista wdrożeniowa / „dokończ plan klienta" widoczna na dashboardzie, nie chowana w menu.
- **Reciprocity**: daj wartość zanim poprosisz o wysiłek (podgląd planu/statystyk przed pełnym uzupełnieniem).
- **IKEA / Endowment**: trener współtworzy (klonuje tydzień, personalizuje szablon → plan klienta) → większe przywiązanie.
- **Peak-End Rule**: doświadczenie oceniane po szczycie i końcu. Koniec sesji klienta = podsumowanie + PR (`text-pr` / gold tylko przy prawdziwym rekordzie). Ostatni ekran ważniejszy niż środek flow.

### Percepcja (jak mózg czyta UI)

- **Jakob's Law**: trenerzy znają Linear/Notion/arkusze — trzymaj konwencje (lewy nav, Cmd-like patterns gdzie sensowne, tabela serii jak arkusz). Nie wymyślaj nowej metafory bez powodu.
- **Miller / chunking**: grupuj serie, pola formularza i listy po 3–5; unikaj ścian opcji.
- **Serial Position**: najważniejsze pozycje na początku i końcu list/nawigacji (NAV, filtry, akcje wiersza).
- **Fitts's Law**: większy i bliższy cel = szybszy. Mobile: CTA w thumb zone (dolna 1/3); cele ≥ 44×44px — szczegóły w `responsive-ui` / `fitness-ui-ux`.
- **Aesthetic-Usability**: dopracowany UI jest postrzegany jako łatwiejszy — polerowanie (tokeny, rytm 8px, stany) to nie luksus, to redukcja tarcia.

---

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

---

## Granice etyczne (anty–dark patterns)

Perswazja OK, gdy pomaga trenerowi/klientowi osiągnąć ich cel. Manipulacja — nie.

Testy przed shipem:

1. **Autonomia** — czy user rozumie skutek i może wybrać inaczej?
2. **Odwracalność** — czy łatwo cofnąć (undo / wyjście) bez kary?
3. **Symetria** — czy rezygnacja / anulowanie jest tak samo łatwe jak zgoda?

Zakazane:

- Confirmshaming („Nie, nie chcę lepszych wyników").
- Fałszywa pilność / sztuczny countdown.
- Fikcyjny social proof lub wymyślone liczby.
- Ukrywanie kosztu / skutku destrukcyjnej akcji.
- Forced continuity (trudna rezygnacja, łatwa zgoda) — gdy pojawi się billing.

---

## Gotchas (błędy juniora)

- **"Zero" start**: nie „Brak planów" → „Zacznij od pierwszego planu" + ilustracja + CTA (`EmptyState`).
- **Checklist-tour**: „dodaj zdjęcie profilowe" zamiast akcji korelującej z retencją.
- **Modal potwierdzenia** tam, gdzie wystarczy undo.
- **Spinner / skeleton < 100 ms** lub skeleton niezgodny z finalnym layoutem (jank).
- **Range trap**: zakresy kotwiczą na górnej liczbie — podaj konkret.
- **Transactional copy**: samo „OK" na kluczowej akcji. CTA = czasownik + obiekt („Przypisz plan", „Zapisz plan") — nie slogan („Odblokuj progres"). Skill `ux-writing`.
- **Hidden options / banery**: kluczowa treść za dropdownem lub „Odkryj więcej".
- **Wiele dominant**: więcej niż 1 primary CTA na widok.
- **Ściana kafelków** zamiast tabeli przy zadaniu enumeracyjnym.
- **Gęstość UI zamiast gęstości danych**: dużo ramek/ikonek/akcji zamiast treści — złamanie minimalizmu (test odejmowania).
- **Wykres z uciętą osią** wyolbrzymiający drobne różnice.
- **Ikony nieoczywiste**; znaczenie tylko kolorem.
- **Niski kontrast**: tekst &lt; 4.5:1; inactive/UI &lt; 3:1.
- **Dekoracyjna animacja** bez feedbacku / przejścia.
- **Confirmshaming / fake urgency / fake social proof**.

---

## Output template (redesign / code review)

```
### <nazwa elementu / widoku>
- Current Friction Point: <błąd juniora>
- Senior Transformation: <zoptymalizowany opis/kod z tokenami>
- Psychological Driver: <"why", np. Goal Gradient / Peak-End / Hick>
- Interaction Cost Delta: <ile kliknięć/tapnięć/decyzji/czasu oszczędza>
- Ethical Check: <autonomia / odwracalność / symetria — OK lub ryzyko>
```

---

## Senior Excellence Checklist (Final Validation)

**Friction i psychologia**

- [ ] Friction Audit — koszt interakcji policzony i obniżony (lub uzasadniony)
- [ ] Cognitive Mapping — zastosowano właściwą grupę (Decyzja / Motywacja / Percepcja)
- [ ] Smart defaults/presety; prefill; default bezpieczny i odwracalny
- [ ] Hick: mniej widocznych opcji naraz; progressive disclosure dla zaawansowanych
- [ ] **Test odejmowania** — czy coś można usunąć zamiast dodać? (portal i panel; `design-system`)
- [ ] Progress/kreator nie startuje od 0%; Zeigarnik widoczny gdzie sensowne
- [ ] Peak-End: koniec flow ma podsumowanie / celebrację (PR tylko gdy prawdziwy)
- [ ] 1 primary CTA; Von Restorff — jedna dominanta

**Aktywacja i empty states**

- [ ] Template-first / sample zamiast pustego canvasu gdzie dotyczy
- [ ] Empty states edukują + pokazują stan docelowy + 1 CTA (`EmptyState`)
- [ ] Checklista/onboarding uczy akcji korelującej z retencją, nie vanity

**Formularze**

- [ ] Minimalna liczba pól; single-column na mobile
- [ ] Walidacja inline na blur; dane nie giną; scroll do błędu
- [ ] Autofill / inputMode; „po co to pole" przy wrażliwych danych
- [ ] CTA = czasownik + obiekt („Przypisz plan", „Zapisz plan") — nie samo „OK" i nie slogan; skill `ux-writing`. Przy Pobierz/Wgraj obiekt = zawartość pliku, nie cel („do przeniesienia”).

**Hierarchia, skanowanie, craft**

- [ ] Value > Label; F-pattern; recognition over recall (Avatar, nie ID)
- [ ] Hierarchia wagą/kolorem (max 3 wagi); elewacja luminancją, nie cieniem
- [ ] Kluczowe wybory jako karty/segmented, nie ukryte w select/banerze
- [ ] Tooltip/reassurance w punktach wahania; ikony powszechnie znane
- [ ] Micro-interactions ≤ 200 ms; zero layout-shift; hover + focus-visible

**Perceived performance**

- [ ] Brak spinnera/skeletonu < 100 ms; skeleton > 300 ms = 1:1 layout
- [ ] Optimistic UI tylko odwracalne + rollback / `useUndoToast`
- [ ] (mobile sesja) thumb zone, tap ≥ 44px, rest timer, < 10 tapnięć/ćwiczenie

**Dashboard / dane**

- [ ] Odwrócona piramida; KPI z trendem; zasada 5 sekund
- [ ] Enumeracja = tabela/lista; uczciwe wykresy (oś od zera gdzie trzeba)

**Etyka i system**

- [ ] Test autonomii / odwracalności / symetrii — brak dark patterns
- [ ] Tylko realne dane — zero fake social proof / urgency
- [ ] Kontrast: tekst ≥ 4.5:1, inactive/UI ≥ 3:1; znaczenie nie tylko kolorem
- [ ] Tokeny semantyczne z `design-system` — zero surowych `zinc-*`/`yellow-*`/`red-*`/`emerald-*`
- [ ] Zgodność z `responsive-ui` (nic ucięte, nic poza kontenerem)
- [ ] Zgodność z `fitness-ui-ux` (tryb planowania vs wykonania)
