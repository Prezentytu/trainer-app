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

Czytaj, gdy zmieniasz onboarding, pierwsze użycie albo empty state nowego konta. Pełna treść: [references/obszary.md](references/obszary.md).

---

## Formularze (Baymard)

Czytaj, gdy dodajesz albo zmieniasz formularz. Pełna treść: [references/obszary.md](references/obszary.md).

---

## Perceived performance

Czytaj, gdy zmiana dotyka ładowania, skeletonów, optymistycznych zapisów albo czasu odpowiedzi. Pełna treść: [references/obszary.md](references/obszary.md).

---

## Dashboard i statystyki

Czytaj, gdy zmieniasz dashboard, statystyki albo wykresy. Pełna treść: [references/obszary.md](references/obszary.md).

---

## Procedury techniczne

Czytaj przy hierarchii i skanowaniu widoku, polerowaniu dark mode albo trybie logowania sesji na mobile. Pełna treść: [references/obszary.md](references/obszary.md).

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
