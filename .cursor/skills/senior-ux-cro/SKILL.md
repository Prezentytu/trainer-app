---
name: senior-ux-cro
description: Senior UX/UI + psychologia konwersji (CRO) dla Trainer App — redukcja kosztu interakcji i wykorzystanie biasów poznawczych, żeby UI był na poziomie top produktów. Użyj przy KAŻDEJ implementacji lub redesignie UI (strony, komponenty, formularze, kreator planów, logowanie sesji, statystyki, empty states, nawigacja). EN triggers - conversion optimization, UX psychology, interaction cost, visual hierarchy, empty state, CTA microcopy. Czytaj razem z `design-system` (tokeny) i `fitness-ui-ux` (domena) oraz `responsive-ui`.
---

# Senior UX/UI & Conversion (CRO) — Trainer App

Warstwa "10/10": senior nie tylko projektuje wygląd — **zarządza uwagą i minimalizuje koszt interakcji** (poznawczy, fizyczny, czasowy). Interfejs ma prowadzić użytkownika i usuwać wątpliwości na każdym kroku.

Ten skill dokłada psychologię konwersji do warstwy wizualnej. Stosuj ŁĄCZNIE z:

- `design-system` — tokeny semantyczne (`bg-surface`, `text-foreground`, `text-muted`, `accent`), typografia, spacing, radius. Zero surowych `zinc-*`/`yellow-*`.
- `fitness-ui-ux` — domena (kreator planów = gęstość; logowanie sesji = wielka typografia, minimum tapnięć).
- `responsive-ui` — mobile-first, nic ucięte, nic poza kontenerem.

Kontekst: dark-only, UI po polsku, portal trenera (B2B). Brak konsumenckiego premium — hooki subskrypcyjne stosuj tylko przy realnym billingu.

---

## Workflow: Plan-Validate-Execute

1. **Friction Audit** — policz koszt interakcji: ile kliknięć/tapnięć i decyzji do celu. Gdzie user się waha?
2. **Cognitive Mapping** — zmapuj UI na 6 zasad: Defaults, Goal Gradient, Reciprocity, IKEA, Loss Aversion, Contrast.
3. **Visual Refinement** — label-value, tinted shadows, F-pattern, active states, stany hover/focus.
4. **Final Validation** — przejdź "Senior Excellence Checklist" (na dole) PRZED oddaniem.

Każda zmiana ma obniżyć koszt interakcji LUB wykorzystać bias, nie pogarszając spójności z design systemem.

---

## 6 zasad psychologicznych

- **Smart Defaults**: nigdy pusty formularz. Kreator planów — presety serii (6-4-2-5-3-1, rampa+back-off) zamiast ręcznego klikania; nowa seria dziedziczy ciężar/powtórzenia z poprzedniej (prefill). Default bezpieczny i odwracalny.
- **Goal Gradient**: progress/onboarding/kreator nie startuje od 0% — pokaż częściowe wypełnienie ("Szablon wybrany +20%"). Bliżej celu = mocniejsza motywacja.
- **Reciprocity**: daj wartość zanim poprosisz o wysiłek (podgląd planu/statystyk przed pełnym uzupełnieniem).
- **IKEA/Endowment**: trener współtworzy (klonuje tydzień, personalizuje szablon → plan klienta) → większe przywiązanie i mniejsza rezygnacja.
- **Loss Aversion**: ramka straty (~2x silniejsza): "Ryzykujesz utratę niezapisanych zmian w planie". Undo dla usunięć.
- **Contrast (anchoring)**: 1 wizualna dominanta na widok — główny CTA `bg-accent` na monochromatycznym tle; reszta ghost/secondary. Nie pokazuj opcji/kosztu w izolacji.

---

## Procedury techniczne

### Hierarchia i skanowanie

- **Value > Label**: kluczowe liczby (serie×powtórzenia, ciężar, %1RM, PR) mocniejsze niż etykiety — większa waga/kontrast (`text-foreground` `font-semibold`) vs `text-muted`. User skanuje dane.
- **F-pattern**: kontrolki (checkbox/radio/uchwyt, akcje) po lewej, zgodnie z porządkiem czytania; najważniejsze u góry-lewej.
- **Recognition over recall**: avatary/miniatury klientów zamiast surowych ID; ikona ćwiczenia w kontekście zamiast samej nazwy.
- **Hierarchia wagą i kolorem, nie rozmiarem** (zgodnie z `design-system`): max 3 wagi fontu; różnicuj `foreground` vs `muted*`, nie skoki rozmiaru.

### Polerowanie

- **Tinted shadows**: cień dopasowany kolorem do tła (nie czysta czerń); miękki, niski opacity. Separacja subtelną różnicą tła (`surface` vs `surface-sunken`), ramki tylko gdzie trzeba.
- **Micro-interactions ≤150-200ms**: `transition` powiązany z fizyką; zero layout-shift na hover. Każdy klikalny element ma `:hover` i `:focus-visible` (klawiatura).
- **Konkretne dane**: "221 sesji", "4.9" zamiast okrągłych "500" — autentyczność. Tylko realne dane.
- **Visual swatches zamiast dropdownów**: kluczowe wybory (typ dnia, wariant progresji) jako klikalne karty/segmented, nie ukryte w `<select>`.
- **Reasuring micro-interactions**: tooltip na hover/focus w punkcie wahania (opis presetu, skutek akcji).

### Tryb logowania sesji (mobile, jeśli dotyczy)

- Najważniejszy CTA w dolnej 1/3 (thumb zone); dodanie serii ≤ 2 tapnięcia.
- Cele dotykowe ≥ 44×44px; jeśli jest bottom nav: 3-5 zakładek, active = min. 2 zmiany wizualne (kolor + filled icon + bold), separacja od treści 1px/cień, safe area (Home Indicator ~34px).
- Rest timer duży i nie do zgubienia; optymistyczny UI (<100ms), sync w tle.

---

## Gotchas (błędy juniora)

- **"Zero" start**: nie "Brak planów" → "Zacznij od pierwszego planu" + ilustracja + CTA (użyj `EmptyState`). Nigdy ślepa uliczka.
- **Range trap**: nie pokazuj zakresów tam, gdzie liczy się jedna wartość — mózg kotwiczy na górnej. Podaj konkret.
- **Transactional copy**: unikaj "Zapisz"/"OK" na kluczowej akcji → benefit-driven ("Utwórz plan", "Zaloguj serię").
- **Hidden options / banery**: nie chowaj kluczowej treści za dropdownem/banerem. Eksponuj bezpośrednio (niższy interaction cost).
- **Wiele dominant**: 1 primary CTA na widok; reszta secondary/ghost.
- **Ikony**: tylko powszechnie znane symbole (lupa = szukaj).
- **Niski kontrast**: nieaktywne ikony/tekst ≥ 3:1; znaczenie nie tylko kolorem (dodaj tekst/ikonę). Kontrast tekstu ≥ 4.5:1.
- **Dekoracyjna animacja**: każdy ruch = feedback lub przejście.

---

## Output template (redesign / code review)

```
### <nazwa elementu / widoku>
- Current Friction Point: <błąd juniora>
- Senior Transformation: <zoptymalizowany opis/kod z tokenami>
- Psychological Driver: <"why", np. Goal Gradient Effect>
- Interaction Cost Delta: <ile kliknięć/tapnięć/decyzji oszczędza>
```

---

## Senior Excellence Checklist (Final Validation)

- [ ] Friction Audit — koszt interakcji policzony i obniżony
- [ ] Value > Label; kontrolki po lewej (F-pattern); recognition over recall (avatary, nie ID)
- [ ] 1 primary CTA na widok; hierarchia wagą/kolorem (max 3 wagi fontu)
- [ ] Smart defaults/presety zamiast pustych pól; prefill z poprzedniej wartości
- [ ] Progress/kreator nie startuje od 0%
- [ ] Empty states edukują + CTA (`EmptyState`), nie ślepa uliczka
- [ ] Brak range trap; konkretne liczby zamiast okrągłych
- [ ] Kluczowe wybory eksponowane (karty/segmented), nie w select/banerze
- [ ] Microcopy benefit-driven, nie "Zapisz/OK"
- [ ] Tooltip/reassurance w punktach wahania; ikony powszechnie znane
- [ ] Cienie tinted; micro-interactions ≤200ms; zero layout-shift; hover + focus-visible
- [ ] (mobile) thumb zone, tap ≥44px, bottom nav active = 2 zmiany, safe area
- [ ] Kontrast: tekst ≥4.5:1, inactive/UI ≥3:1; znaczenie nie tylko kolorem
- [ ] Tokeny semantyczne z `design-system` — zero surowych `zinc-*`/`yellow-*`/`red-*`/`emerald-*`
- [ ] Zgodność z `responsive-ui` (nic ucięte, nic poza kontenerem)
