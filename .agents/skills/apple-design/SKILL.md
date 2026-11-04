---
name: apple-design
description: Podejście Apple do interfejsu (response, direct manipulation, materiały, typografia, craft) przetłumaczone na Trainer App / Acid — bez nowej biblioteki motion. Używaj, gdy zmiana dotyczy ruchu i reakcji interfejsu — feedback po naciśnięciu, przejścia i animacje, gesty i przeciąganie, materiały i przezroczystość, dialogi i arkusze, typografia optyczna albo reduced motion. Nie do zmiany samego układu, koloru czy tekstu. EN triggers — fluid interfaces, press feedback, materials, translucency, backdrop-filter, spatial consistency, optical sizing, tracking, reduced motion, craft, delight. Inne skille UI dobierz do zmiany według wiersza UI w Task Router (AGENTS.md).
---

# Apple Design — craft interakcji (Trainer App)

Interfejs czuje się żywy, gdy reaguje natychmiast, śledzi gest 1:1, zachowuje spójność przestrzenną i nie kradnie uwagi. Ten skill tłumaczy zasady z WWDC (*Designing Fluid Interfaces*, typografia, materiały, Principles of Great Design) na realia Acid — **bez wprowadzania springów ani biblioteki motion**.

Powiązane skille (dobierz te, których dotyczy zmiana, według wiersza UI w Task Router w AGENTS.md, nie wszystkie naraz):

- `design-system` — tokeny, typografia, spacing, motion (`--dur-*`, `--ease-*`, press `scale(0.98)`, bez bounce).
- `fitness-ui-ux` — dwa tryby: planowanie (gęstość) vs wykonanie/sesja (minimum interakcji).
- `senior-ux-cro` — friction, perceived performance, etyka (checklista CRO osobno).
- `ux-writing` — głos, microcopy, test na głos; jasność przed zwięzłością.
- `responsive-ui` — mobile-first, cele ≥ 44px, nic poza kontenerem.

Źródło prawdy dla timingów i press: `design-system` + `apps/web/app/globals.css`. Ten skill **nie zmienia** tych wartości.

---

## Idea

Gdy UI dopasowuje się do tego, jak myślimy i ruszamy, przestaje być „komputerem" — staje się przedłużeniem gestu. Cztery potrzeby użytkownika: **bezpieczeństwo/przewidywalność, zrozumienie, osiągnięcie, radość**. Każda reguła poniżej służy jednej z nich.

W sesji treningowej (tryb wykonania) priorytet to zero obciążenia i natychmiastowy feedback. W kreatorze planów — przewidywalność i gęstość bez dekoracyjnego ruchu.

---

## 1. Response — zero opóźnień

Chwila lagów zabija poczucie bezpośredniego sterowania.

- **Feedback na pointer-down, nie na release.** Przyciski: istniejące `active:scale-[0.98]` + `transition` z `--dur-fast` (120ms) / `--ease-out` w `Button` / `IconButton` (`apps/web/components/ui.tsx`). Nie czekaj na `click`.
- **Audytuj latency na ścieżce inputu:** zbędne debounce, sztuczne `setTimeout` przed feedbackiem, czekanie na koniec transition zanim pokażesz stan.
- **Feedback ciągły w trakcie interakcji**, nie tylko na końcu. Pasek przerwy (`SessionDock`) i pasek postępu sesji aktualizują się na bieżąco — tak ma być. Suwak/drag/drawer (gdy kiedyś powstanie) musi śledzić pointer 1:1 przez cały gest.
- Perceived performance: progi z `senior-ux-cro` (< 100 ms bez spinnera; > 300 ms skeleton 1:1).

---

## 2. Bezpośrednia manipulacja

> Touch i treść ruszają się razem.

- Gdy użytkownik przeciąga element, UI musi zostać „przyklejone" do punktu chwytu (offset od miejsca grab — nie snap do środka). Dziś dotyczy to głównie `@dnd-kit` w kreatorze planów (`PlanBuilder`).
- Preferuj ciągłe śledzenie (pointer move) nad recognizerami typu „swipeleft" zwracającymi tylko stan końcowy — te ostatnie wyrzucają feedback w trakcie.
- Tap: highlight na down, commit na up; ~10px hysteresis; anulowanie przez przeciągnięcie poza cel i powrót.

---

## 3. Ruch — co stosujemy teraz

Wyłącznie istniejący stos CSS. **Bez bounce. Bez nowej zależności motion.**

| Token / wzorzec | Wartość / użycie |
|---|---|
| `--dur-fast` | 120ms — press, hover kolor, micro |
| `--dur-med` | 220ms — typowe przejścia UI |
| `--dur-slow` | 360ms — rzadsze, większe powierzchnie |
| `--ease-out` / `--ease-in` | wyjście / wejście (odwracalne ścieżki) |
| Press | `active:scale-[0.98]` (Button/IconButton); sesja czasem `0.96`/`0.94` na checku |
| Właściwości | animuj `transform` i `opacity`; unikaj layout thrash |
| `@keyframes` | tylko w `globals.css` (skeleton, PR, landing) — nie w komponentach ad hoc |
| `will-change` | tylko gdy ruch jest **imminent** i mierzalnie pomaga; potem usuń |

Timery i progress (rest, pasek sesji) mogą aktualizować się ciągle — to nie jest „dekoracyjna animacja".

`prefers-reduced-motion` wyłącza dekoracyjne keyframes (scanline, tick, stagger, PR celebrate) — już w `globals.css`.

---

## 4. Ask First — springi i gesty ciągłe

Czytaj, zanim zaproponujesz spring, gest ciągły albo nową bibliotekę ruchu. Pełna treść: [references/zaawansowane.md](references/zaawansowane.md).

---

## 5. Spójność przestrzenna

- **Wejście i wyjście tą samą drogą.** Panel z prawej wychodzi w prawo; nie in-from-right / out-the-bottom.
- **Kotwica do źródła.** Menu, popover, przyszły sheet: `transform-origin` (lub wizualny origin) przy elemencie, który otworzył warstwę — `Dialog` (`ui.tsx`), drawer (`AppShell`), menu sesji (`[data-session-menu]` w `SessionLogger`).
- **Odwracalne przejścia:** outbound ≈ inverse inbound — `--ease-out` w jedną stronę, `--ease-in` w drugą (lub lustrzane cubic-bezier).
- Hint kierunku: klatki pośrednie mają telegrafować wynik (np. moduł „rośnie" w stronę palca), nie ślepo interpolować.

---

## 6. Materiały i głębia

Czytaj, gdy zmiana używa blur, przezroczystości, `.session-chrome` albo warstw nad treścią. Pełna treść: [references/zaawansowane.md](references/zaawansowane.md).

---

## 7. Typografia (optyka)

Źródło tokenów i fontów: `design-system`. Tu tylko reguły optyczne:

- **Tracking zależny od rozmiaru** — nigdy jedna wartość na wszystkie rozmiary. Duże display / `.display-caps`: ujemny (`tracking-display`). Mono caps / eyebrows: `tracking-caps`. Body ≈ 0.
- **Leading odwrotnie do rozmiaru** — ciasny na dużych nagłówkach, luźniejszy na body; UI gęste (tabela serii) → ciaśniej.
- Hierarchia = **waga + rozmiar + leading** jako zestaw, nie sam rozmiar.
- Spacing layoutu w `rem`/`em`, żeby większy font użytkownika nie łamał układu (`responsive-ui`).
- Liczby: `font-mono tabular-nums` (serie, kg, sekundy).

---

## 8. Feedback multimodalny

1. **Przyczynowość** — oczywiste, co wywołało feedback; trigger na zdarzeniu przyczynowym (toggle, snap, koniec przerwy, PR).
2. **Harmonia** — wizual + dźwięk + haptyka w tej samej „klatce". Dziś: alarm audio w `useRestTimer` — nie opóźniaj go CSS transition.
3. **Użyteczność** — haptyka/dźwięk tylko na znaczące momenty (koniec przerwy, commit serii, prawdziwy PR). Over-feedback uczy ignorowania.

Nota: `navigator.vibrate` jest **słabo wspierany w Safari iOS** — nie buduj krytycznej ścieżki wyłącznie na Vibration API; wizual + audio pozostają źródłem prawdy. Haptyka w `fitness-ui-ux` (rest timer) = cel produktowy, nie gwarancja platformy.

---

## 9. Dostępność ruchu i materiałów

Trzy niezależne sygnały — buduj w komponentach:

| Preferencja | Zachowanie |
|---|---|
| `prefers-reduced-motion: reduce` | cross-fade / opacity zamiast slide/spring; zero overshoot; zachowaj zmiany koloru/stanu pomagające zrozumieć UI (już: keyframes dekoracyjne wyłączone w `globals.css`) |
| `prefers-reduced-transparency: reduce` | wyższa opacity tła, bez `backdrop-filter` (już: `.session-chrome`) |
| `prefers-contrast: more` | rozważ przy nowym UI: bliżej solidnych tła + wyraźniejszy border (dziś brak dedykowanego media query — nie blokuj, ale nie zakładaj) |

Unikaj: pełnoekranowych ruchomych teł, wolnych pętli ~0,2 Hz, nagłych skoków jasności przy zmianie stanu.

---

## 10. Osiem zasad (słownik decyzji)

Czytaj, gdy rozstrzygasz spór projektowy i potrzebujesz słownika decyzji. Pełna treść: [references/zaawansowane.md](references/zaawansowane.md).

---

## Twarde granice

- Nie dodawaj biblioteki motion / spring bez Ask First.
- Nie wprowadzaj bounce — `design-system` zabrania.
- Nie używaj surowych hexów / `zinc-*` na materiałach — tokeny + istniejące `.session-chrome`.
- Nie duplikuj checklisty CRO z `senior-ux-cro` — tu craft interakcji i materiałów.
- Nie animuj layoutu (width/height/top) gdy wystarczy `transform`/`opacity`.

---

## Checklist — Apple craft

Przed oddaniem UI (przy nowym ekranie lub redesignie także Senior Excellence z `senior-ux-cro`):

- [ ] Press feedback na pointer-down (`active:scale` / stan), nie dopiero na click
- [ ] Brak zbędnego debounce/timeout na ścieżce feedbacku; < 100 ms dla lokalnego efektu
- [ ] Ciągły feedback podczas trwającej interakcji (pasek, drag), nie tylko na końcu
- [ ] Wejście i wyjście warstwy tą samą ścieżką; origin kotwiczy do triggera
- [ ] Timing wyłącznie z `--dur-fast` / `--dur-med` / `--ease-*`; bez bounce
- [ ] Materiały: `.session-chrome` / istniejące blur — nigdy glass-on-glass; treść pod chrome
- [ ] Scroll edge (gradient/blur) zamiast twardego dividera pod floating UI, gdzie dotyczy
- [ ] Tracking size-specific; liczby `font-mono tabular-nums`
- [ ] `prefers-reduced-motion` i `prefers-reduced-transparency` respektowane; nowe animacje pod `no-preference`
- [ ] Brak nowej zależności motion; dźwięk/haptyka tylko na znaczące momenty i zsynchronizowane

---

## Powiązane

- Tokeny, motion 120/220, press, fonty: skill `design-system`.
- Sesja vs kreator, rest timer, haptyka jako cel: skill `fitness-ui-ux`.
- Friction, perceived performance, Senior Excellence Checklist: skill `senior-ux-cro`.
- Mobile-first, cele 44px, drawer: skill `responsive-ui`.
- Chrome sesji / blur: `apps/web/app/globals.css` (`.session-chrome`).
- Prymitywy: `apps/web/components/ui.tsx` (`Button`, `Dialog`, `Switch`, `ProgressRing`).
